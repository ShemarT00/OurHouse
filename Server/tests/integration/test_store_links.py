"""
Store links (#41), against the live Supabase project: retailers can be read by
any signed-in user but written by no one; a store is linked to a retailer, has
its own website, or neither, and the database refuses anything else even when
going straight to Supabase; and any member can edit a store's name and link,
without moving it or creating notifications.
Run with:  pytest -m integration
"""

import uuid

import pytest
from postgrest.exceptions import APIError

from households.HouseholdDAO import HouseholdDAO
from notifications.NotifDAO import NotificationDAO
from retailers.RetailerDAO import RetailerDAO
from schema import Retailer, Store
from stores.StoreDAO import DuplicateStoreError, StoreDAO
from supabase_client import get_user_client

pytestmark = pytest.mark.integration

SEEDED = {"aldi", "asda", "tesco", "sainsburys", "lidl", "morrisons", "waitrose", "iceland", "coop", "mands", "ocado"}
RLS_REFUSED = "42501"
FOREIGN_KEY_VIOLATION = "23503"
CHECK_VIOLATION = "23514"
VALUE_TOO_LONG = "22001"


def _stores(token):
    return get_user_client(token).table(Store.db_table())


@pytest.fixture()
def home(make_user, cleanup_households):
    """Owner's household with one unlinked store; returns (owner_token, household, store)."""
    _, owner_token = make_user("Owner")
    household = HouseholdDAO().create_household(owner_token, "Store Link House")
    cleanup_households.append(household.id)
    corner = StoreDAO().create_store(owner_token, Store(name="Corner shop", household_id=household.id))
    return owner_token, household, corner


@pytest.fixture()
def temporary_retailer(admin):
    """Add retailers with the service key (members cannot) and remove them afterwards."""
    keys = []

    def _add(retired=False):
        retailer = Retailer(key=f"test-{uuid.uuid4().hex[:12]}", name="Zz Test Retailer",
                            homepage="https://retailer.example", retired=retired)
        admin.table(Retailer.db_table()).insert(retailer.to_row()).execute()
        keys.append(retailer.key)
        return retailer

    yield _add
    for key in keys:
        # Runs before cleanup_households, so unlink stores first or the foreign key blocks the delete
        admin.table(Store.db_table()).update({Store.column("retailer_key"): None}).eq(
            Store.column("retailer_key"), key).execute()
        admin.table(Retailer.db_table()).delete().eq(Retailer.column("key"), key).execute()


def test_members_read_the_seeded_retailers(home):
    owner_token, _, _ = home

    retailers = RetailerDAO().fetch_retailers(owner_token)

    assert SEEDED <= {r.key for r in retailers}
    assert not any(r.retired for r in retailers)
    for retailer in retailers:
        assert retailer.homepage.startswith("https://")
        assert retailer.search_url is None or "{query}" in retailer.search_url


def test_retired_retailers_are_left_out(home, temporary_retailer):
    owner_token, _, _ = home
    retired = temporary_retailer(retired=True)

    assert retired.key not in {r.key for r in RetailerDAO().fetch_retailers(owner_token)}
    assert RetailerDAO().fetch_retailer(owner_token, retired.key).retired is True


def test_no_one_can_write_retailers(home):
    owner_token, _, _ = home
    retailers = get_user_client(owner_token).table(Retailer.db_table())
    tesco_before = RetailerDAO().fetch_retailer(owner_token, "tesco")

    with pytest.raises(APIError) as error:
        retailers.insert(Retailer(key="fake", name="Fake", homepage="https://fake.example").to_row()).execute()
    assert error.value.code == RLS_REFUSED

    # No UPDATE or DELETE policy, so RLS matches no rows
    assert retailers.update({Retailer.column("homepage"): "https://evil.example"}).eq(
        Retailer.column("key"), "tesco").execute().data == []
    assert retailers.delete().eq(Retailer.column("key"), "tesco").execute().data == []
    assert RetailerDAO().fetch_retailer(owner_token, "tesco") == tesco_before


def test_store_links_to_a_retailer_or_a_website(home):
    owner_token, household, _ = home
    stores = StoreDAO()

    tesco = stores.create_store(owner_token, Store(name="Tesco", household_id=household.id, retailer_key="tesco"))
    market = stores.create_store(owner_token, Store(
        name="Market", household_id=household.id, website="https://market.example.com"))

    assert (tesco.retailer_key, tesco.website) == ("tesco", None)
    assert (market.retailer_key, market.website) == (None, "https://market.example.com")


def test_two_stores_may_link_to_the_same_retailer_with_different_names(home):
    owner_token, household, _ = home
    stores = StoreDAO()

    stores.create_store(owner_token, Store(name="Big Tesco", household_id=household.id, retailer_key="tesco"))
    stores.create_store(owner_token, Store(name="Tesco Express", household_id=household.id, retailer_key="tesco"))

    with pytest.raises(DuplicateStoreError):
        stores.create_store(owner_token, Store(name="big tesco", household_id=household.id, retailer_key="aldi"))


def test_database_refuses_an_unknown_retailer(home):
    owner_token, household, corner = home

    with pytest.raises(APIError) as error:
        _stores(owner_token).insert(
            Store(name="Fake", household_id=household.id, retailer_key="not-a-retailer").to_row()).execute()
    assert error.value.code == FOREIGN_KEY_VIOLATION

    with pytest.raises(APIError) as error:
        StoreDAO().update_store(owner_token, household.id, corner.id, {"retailer_key": "not-a-retailer"})
    assert error.value.code == FOREIGN_KEY_VIOLATION


def test_database_refuses_both_link_fields(home):
    owner_token, household, corner = home

    with pytest.raises(APIError) as error:
        _stores(owner_token).insert(Store(
            name="Both", household_id=household.id, retailer_key="tesco", website="https://tesco.com").to_row()
        ).execute()
    assert error.value.code == CHECK_VIOLATION

    StoreDAO().update_store(owner_token, household.id, corner.id, {"retailer_key": "tesco"})
    with pytest.raises(APIError) as error:
        StoreDAO().update_store(owner_token, household.id, corner.id, {"website": "https://corner.example"})
    assert error.value.code == CHECK_VIOLATION


@pytest.mark.parametrize("website,code", [
    ("corner.example", CHECK_VIOLATION),
    ("javascript:alert(1)", CHECK_VIOLATION),
    ("ftp://corner.example", CHECK_VIOLATION),
    ("https://corner.example/" + "a" * 2048, VALUE_TOO_LONG),
])
def test_database_refuses_a_bad_website(home, website, code):
    owner_token, household, _ = home

    with pytest.raises(APIError) as error:
        _stores(owner_token).insert(Store(name="Bad", household_id=household.id, website=website).to_row()).execute()
    assert error.value.code == code


def test_any_member_edits_a_stores_name_and_link(make_user, home):
    _, household, corner = home
    _, joiner_token = make_user("Joiner")
    HouseholdDAO().join_household(joiner_token, household.invite_code)
    stores = StoreDAO()

    edited = stores.update_store(joiner_token, household.id, corner.id, {
        "name": "Corner Shop", "retailer_key": None, "website": "https://corner.example"})
    assert (edited.name, edited.website) == ("Corner Shop", "https://corner.example")

    edited = stores.update_store(joiner_token, household.id, corner.id, {"retailer_key": "aldi", "website": None})
    assert (edited.retailer_key, edited.website) == ("aldi", None)


def test_edit_keeps_names_unique(home):
    owner_token, household, corner = home
    StoreDAO().create_store(owner_token, Store(name="Aldi", household_id=household.id))

    with pytest.raises(DuplicateStoreError):
        StoreDAO().update_store(owner_token, household.id, corner.id, {"name": " ALDI "})


def test_non_member_cannot_edit_a_store(make_user, home):
    owner_token, household, corner = home
    _, outsider_token = make_user("Outsider")

    assert StoreDAO().update_store(outsider_token, household.id, corner.id, {"name": "Mine now"}) is None
    assert StoreDAO().fetch_store(owner_token, household.id, corner.id).name == "Corner shop"


def test_store_cannot_move_to_another_household(make_user, cleanup_households, home):
    owner_token, household, corner = home
    other = HouseholdDAO().create_household(owner_token, "Owner's Other House")
    cleanup_households.append(other.id)

    with pytest.raises(APIError) as error:
        _stores(owner_token).update({Store.column("household_id"): other.id}).eq(
            Store.column("id"), corner.id).execute()
    assert error.value.code == RLS_REFUSED  # only name and link columns may be updated
    assert StoreDAO().fetch_store(owner_token, household.id, corner.id) is not None


def test_stores_still_cannot_be_deleted(home):
    owner_token, household, corner = home

    assert _stores(owner_token).delete().eq(Store.column("id"), corner.id).execute().data == []
    assert StoreDAO().fetch_store(owner_token, household.id, corner.id) == corner


def test_a_retailer_in_use_cannot_be_deleted(admin, home, temporary_retailer):
    owner_token, household, corner = home
    retailer = temporary_retailer()
    StoreDAO().update_store(owner_token, household.id, corner.id, {"retailer_key": retailer.key})

    with pytest.raises(APIError) as error:
        admin.table(Retailer.db_table()).delete().eq(Retailer.column("key"), retailer.key).execute()
    assert error.value.code == FOREIGN_KEY_VIOLATION


def test_editing_a_store_creates_no_notifications(shared_household):
    (_, alex_token), (_, sam_token), household, _ = shared_household
    store = StoreDAO().create_store(alex_token, Store(name="Tesco", household_id=household.id))

    StoreDAO().update_store(alex_token, household.id, store.id, {"name": "Big Tesco", "retailer_key": "tesco"})

    assert NotificationDAO().fetch_inbox(sam_token) == []
    assert NotificationDAO().fetch_inbox(alex_token) == []
