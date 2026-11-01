"""
Store routes: list a household's stores, add one and edit one.
Supabase is mocked: require_auth's token check, the store and retailer DAOs and
the household lookup used to tell "no stores yet" from "not a member".
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import Household, Retailer, Store
from stores.StoreDAO import DuplicateStoreError

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
AUTH = {"Authorization": "Bearer good-token"}
STORES_URL = "/api/households/5/stores"
STORE_URL = STORES_URL + "/3"
WEBSITE_ERROR = "Website must be a web address, like www.example.com"

RETAILERS = {
    "tesco": Retailer(key="tesco", name="Tesco", homepage="https://www.tesco.com",
                      search_url="https://www.tesco.com/groceries/en-GB/search?query={query}"),
    "gone": Retailer(key="gone", name="Gone", homepage="https://gone.example", retired=True),
}


@pytest.fixture()
def signed_in(monkeypatch):
    admin = MagicMock()
    admin.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=USER_ID))
    monkeypatch.setattr("auth.decorators.get_admin_client", lambda: admin)


@pytest.fixture()
def member_of_household(monkeypatch):
    fetch = MagicMock(return_value=Household(id=5, name="The Smiths", invite_code="ABCD2345"))
    monkeypatch.setattr("households.HouseholdDAO.HouseholdDAO.fetch_household", fetch)
    return fetch


@pytest.fixture()
def not_a_member(monkeypatch):
    monkeypatch.setattr("households.HouseholdDAO.HouseholdDAO.fetch_household", MagicMock(return_value=None))


@pytest.fixture()
def dao(monkeypatch):
    mocks = SimpleNamespace(list=MagicMock(), create=MagicMock(), update=MagicMock())
    monkeypatch.setattr("stores.StoreDAO.StoreDAO.fetch_stores", mocks.list)
    monkeypatch.setattr("stores.StoreDAO.StoreDAO.create_store", mocks.create)
    monkeypatch.setattr("stores.StoreDAO.StoreDAO.update_store", mocks.update)
    monkeypatch.setattr("retailers.RetailerDAO.RetailerDAO.fetch_retailer",
                        MagicMock(side_effect=lambda token, key: RETAILERS.get(key)))
    return mocks


def store(id=1, name="Tesco", retailer_key=None, website=None):
    return Store(id=id, name=name, household_id=5, created_at="2026-10-27T00:00:00Z",
                 retailer_key=retailer_key, website=website)


@pytest.mark.parametrize("method,url", [("GET", STORES_URL), ("POST", STORES_URL), ("PATCH", STORE_URL)])
def test_store_routes_require_a_token(client, method, url):
    assert client.open(url, method=method, json={"name": "x"}).status_code == 401


def test_lists_a_households_stores(client, signed_in, member_of_household, dao):
    dao.list.return_value = [store(1, "Aldi", retailer_key="aldi"), store(2, "Tesco")]

    response = client.get(STORES_URL, headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == [
        {"OHID": 1, "name": "Aldi", "householdId": 5, "createdAt": "2026-10-27T00:00:00Z",
         "retailerKey": "aldi", "website": None},
        {"OHID": 2, "name": "Tesco", "householdId": 5, "createdAt": "2026-10-27T00:00:00Z",
         "retailerKey": None, "website": None},
    ]
    dao.list.assert_called_once_with("good-token", 5)


def test_non_member_gets_404_for_stores(client, signed_in, not_a_member, dao):
    assert client.get(STORES_URL, headers=AUTH).status_code == 404
    dao.list.assert_not_called()


def test_add_store(client, signed_in, member_of_household, dao):
    dao.create.return_value = store(3, "Tesco")

    response = client.post(STORES_URL, json={"name": "  Tesco "}, headers=AUTH)

    assert response.status_code == 201
    assert response.get_json()["OHID"] == 3
    token, new_store = dao.create.call_args.args
    assert token == "good-token"
    assert new_store.to_row() == {
        "stor_name": "Tesco", "stor_household_id": 5, "stor_retailer_key": None, "stor_website": None,
    }


def test_add_store_linked_to_a_retailer(client, signed_in, member_of_household, dao):
    dao.create.return_value = store(3, "Big Tesco", retailer_key="tesco")

    response = client.post(STORES_URL, json={"name": "Big Tesco", "retailerKey": "tesco"}, headers=AUTH)

    assert response.status_code == 201
    assert response.get_json()["retailerKey"] == "tesco"
    assert dao.create.call_args.args[1].retailer_key == "tesco"


@pytest.mark.parametrize("typed,saved", [
    ("example.com", "https://example.com"),
    ("  www.cornershop.co.uk/shop ", "https://www.cornershop.co.uk/shop"),
    ("http://market.example.org", "http://market.example.org"),
    ("HTTPS://Example.com/Path?q=1", "https://Example.com/Path?q=1"),
    ("https://shop.example.com:8443/", "https://shop.example.com:8443/"),
])
def test_add_store_with_a_website(client, signed_in, member_of_household, dao, typed, saved):
    dao.create.return_value = store(3, "Corner shop", website=saved)

    response = client.post(STORES_URL, json={"name": "Corner shop", "website": typed}, headers=AUTH)

    assert response.status_code == 201
    assert dao.create.call_args.args[1].website == saved


@pytest.mark.parametrize("website", [None, "", "   "])
def test_blank_website_means_no_link(client, signed_in, member_of_household, dao, website):
    dao.create.return_value = store(3)

    client.post(STORES_URL, json={"name": "Tesco", "website": website}, headers=AUTH)

    assert dao.create.call_args.args[1].website is None


@pytest.mark.parametrize("website", [
    "ftp://example.com", "javascript:alert(1)", "mailto:shop@example.com", "localhost",
    "https://", "https://example", "https://exa mple.com", "https://user:pw@example.com",
    "https://-bad-.com", "https://example.c0m", "https://example.com:port", 7,
    "https://example.com/" + "a" * 2048,
])
def test_add_store_rejects_an_invalid_website(client, signed_in, member_of_household, dao, website):
    response = client.post(STORES_URL, json={"name": "Corner shop", "website": website}, headers=AUTH)

    assert response.status_code == 400
    assert response.get_json()["message"].endswith(WEBSITE_ERROR)
    dao.create.assert_not_called()


def test_add_store_rejects_both_a_retailer_and_a_website(client, signed_in, member_of_household, dao):
    body = {"name": "Tesco", "retailerKey": "tesco", "website": "tesco.com"}

    assert client.post(STORES_URL, json=body, headers=AUTH).status_code == 400
    dao.create.assert_not_called()


@pytest.mark.parametrize("key", ["nope", "gone", 7, ""])
def test_add_store_rejects_an_unknown_or_retired_retailer(client, signed_in, member_of_household, dao, key):
    response = client.post(STORES_URL, json={"name": "Tesco", "retailerKey": key}, headers=AUTH)

    assert response.status_code == 400
    dao.create.assert_not_called()


@pytest.mark.parametrize("body", [{}, {"name": ""}, {"name": "  "}, {"name": 7}, {"name": "x" * 256}])
def test_add_store_rejects_invalid_names(client, signed_in, member_of_household, dao, body):
    assert client.post(STORES_URL, json=body, headers=AUTH).status_code == 400
    dao.create.assert_not_called()


def test_add_store_rejects_a_duplicate_name(client, signed_in, member_of_household, dao):
    dao.create.side_effect = DuplicateStoreError('There is already a store called "Tesco"')

    response = client.post(STORES_URL, json={"name": "tesco"}, headers=AUTH)

    assert response.status_code == 400
    assert response.get_json()["message"].endswith('There is already a store called "Tesco"')


def test_non_member_cannot_add_a_store(client, signed_in, not_a_member, dao):
    assert client.post(STORES_URL, json={"name": "Sneaky"}, headers=AUTH).status_code == 404
    dao.create.assert_not_called()


def test_edit_a_stores_name(client, signed_in, member_of_household, dao):
    dao.update.return_value = store(3, "Big Tesco")

    response = client.patch(STORE_URL, json={"name": " Big Tesco "}, headers=AUTH)

    assert response.status_code == 200
    assert response.get_json()["name"] == "Big Tesco"
    dao.update.assert_called_once_with("good-token", 5, 3, {"name": "Big Tesco"})


def test_choosing_a_retailer_clears_the_website(client, signed_in, member_of_household, dao):
    dao.update.return_value = store(3, retailer_key="tesco")

    assert client.patch(STORE_URL, json={"retailerKey": "tesco"}, headers=AUTH).status_code == 200
    dao.update.assert_called_once_with("good-token", 5, 3, {"retailer_key": "tesco", "website": None})


def test_typing_a_website_clears_the_retailer(client, signed_in, member_of_household, dao):
    dao.update.return_value = store(3, website="https://tesco.com")

    assert client.patch(STORE_URL, json={"website": "tesco.com"}, headers=AUTH).status_code == 200
    dao.update.assert_called_once_with("good-token", 5, 3, {"retailer_key": None, "website": "https://tesco.com"})


def test_edit_removes_a_link(client, signed_in, member_of_household, dao):
    dao.update.return_value = store(3)

    body = {"name": "Tesco", "retailerKey": None, "website": None}
    assert client.patch(STORE_URL, json=body, headers=AUTH).status_code == 200
    dao.update.assert_called_once_with("good-token", 5, 3, {"name": "Tesco", "retailer_key": None, "website": None})


@pytest.mark.parametrize("body", [
    {}, {"colour": "red"}, {"name": ""}, {"website": "ftp://x.com"}, {"retailerKey": "gone"},
    {"retailerKey": "tesco", "website": "tesco.com"},
])
def test_edit_rejects_invalid_changes(client, signed_in, member_of_household, dao, body):
    assert client.patch(STORE_URL, json=body, headers=AUTH).status_code == 400
    dao.update.assert_not_called()


def test_edit_rejects_a_body_that_is_not_an_object(client, signed_in, member_of_household, dao):
    assert client.patch(STORE_URL, json=["Tesco"], headers=AUTH).status_code == 400


def test_edit_rejects_a_duplicate_name(client, signed_in, member_of_household, dao):
    dao.update.side_effect = DuplicateStoreError('There is already a store called "Aldi"')

    response = client.patch(STORE_URL, json={"name": "aldi"}, headers=AUTH)

    assert response.status_code == 400
    assert response.get_json()["message"].endswith('There is already a store called "Aldi"')


def test_edit_a_store_from_another_household_is_404(client, signed_in, member_of_household, dao):
    dao.update.return_value = None  # no store 3 in household 5

    assert client.patch(STORE_URL, json={"name": "Aldi"}, headers=AUTH).status_code == 404


def test_non_member_cannot_edit_a_store(client, signed_in, not_a_member, dao):
    assert client.patch(STORE_URL, json={"name": "Sneaky"}, headers=AUTH).status_code == 404
    dao.update.assert_not_called()
