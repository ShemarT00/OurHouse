"""
Row Level Security on STORE (#9), against the live Supabase project: members
add and see their household's stores; non-members can do neither, even when
going straight to the database; and an item can only name a store from its
own household.
Run with:  pytest -m integration
"""

import pytest
from postgrest.exceptions import APIError

from households.HouseholdDAO import HouseholdDAO
from items.ItemDAO import ItemDAO
from lists.ListDAO import ListDAO
from schema import Item, ShoppingList, Store
from stores.StoreDAO import DuplicateStoreError, StoreDAO
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


@pytest.fixture()
def household_with_store(make_user, cleanup_households):
    """Owner's household with one store; returns (owner_token, household, store)."""
    _, owner_token = make_user("Owner")
    household = HouseholdDAO().create_household(owner_token, "Store Test House")
    cleanup_households.append(household.id)  # cascades to stores, lists and items
    tesco = StoreDAO().create_store(owner_token, Store(name="Tesco", household_id=household.id))
    return owner_token, household, tesco


def test_member_adds_and_sees_stores(household_with_store):
    owner_token, household, tesco = household_with_store
    aldi = StoreDAO().create_store(owner_token, Store(name="Aldi", household_id=household.id))

    assert (tesco.name, tesco.household_id) == ("Tesco", household.id)
    assert StoreDAO().fetch_stores(owner_token, household.id) == [aldi, tesco]  # by name


def test_joined_member_sees_and_adds_stores(make_user, household_with_store):
    _, household, tesco = household_with_store
    _, joiner_token = make_user("Joiner")
    HouseholdDAO().join_household(joiner_token, household.invite_code)

    lidl = StoreDAO().create_store(joiner_token, Store(name="Lidl", household_id=household.id))

    assert StoreDAO().fetch_stores(joiner_token, household.id) == [lidl, tesco]


def test_store_names_are_unique_within_a_household(household_with_store):
    owner_token, household, _ = household_with_store

    with pytest.raises(DuplicateStoreError):
        StoreDAO().create_store(owner_token, Store(name="  tesco ", household_id=household.id))


def test_non_member_cannot_see_or_add_stores(make_user, household_with_store):
    owner_token, household, tesco = household_with_store
    _, outsider_token = make_user("Outsider")

    assert StoreDAO().fetch_stores(outsider_token, household.id) == []
    assert StoreDAO().fetch_store(outsider_token, household.id, tesco.id) is None

    with pytest.raises(APIError) as error:
        get_user_client(outsider_token).table(Store.db_table()).insert(
            Store(name="Sneaky", household_id=household.id).to_row()
        ).execute()

    assert error.value.code == "42501"  # RLS refused the row
    assert StoreDAO().fetch_stores(owner_token, household.id) == [tesco]


def test_item_can_only_use_a_store_from_its_own_household(make_user, cleanup_households, household_with_store):
    owner_token, household, tesco = household_with_store
    shopping_list = ListDAO().create_list(owner_token, ShoppingList(name="Weekly shop", household_id=household.id))
    _, other_token = make_user("Other")
    other_household = HouseholdDAO().create_household(other_token, "Other House")
    cleanup_households.append(other_household.id)
    their_store = StoreDAO().create_store(other_token, Store(name="Corner shop", household_id=other_household.id))
    items = ItemDAO()

    milk = items.create_item(owner_token, Item(name="Milk", list_id=shopping_list.id, store_id=tesco.id))
    assert milk.store_id == tesco.id

    with pytest.raises(APIError) as error:
        items.create_item(owner_token, Item(name="Bread", list_id=shopping_list.id, store_id=their_store.id))
    assert error.value.code == "42501"

    with pytest.raises(APIError) as error:
        items.update_item(owner_token, shopping_list.id, milk.id, {"store_id": their_store.id})
    assert error.value.code == "42501"

    assert items.update_item(owner_token, shopping_list.id, milk.id, {"store_id": None}).store_id is None
