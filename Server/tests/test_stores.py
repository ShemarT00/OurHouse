"""
Store routes: list a household's stores and add one.
Supabase is mocked: require_auth's token check, the store DAO and the
household lookup used to tell "no stores yet" from "not a member".
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import Household, Store
from stores.StoreDAO import DuplicateStoreError

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
AUTH = {"Authorization": "Bearer good-token"}
STORES_URL = "/api/households/5/stores"


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
    mocks = SimpleNamespace(list=MagicMock(), create=MagicMock())
    monkeypatch.setattr("stores.StoreDAO.StoreDAO.fetch_stores", mocks.list)
    monkeypatch.setattr("stores.StoreDAO.StoreDAO.create_store", mocks.create)
    return mocks


def store(id=1, name="Tesco"):
    return Store(id=id, name=name, household_id=5, created_at="2026-10-27T00:00:00Z")


@pytest.mark.parametrize("method", ["GET", "POST"])
def test_store_routes_require_a_token(client, method):
    assert client.open(STORES_URL, method=method, json={"name": "x"}).status_code == 401


def test_lists_a_households_stores(client, signed_in, member_of_household, dao):
    dao.list.return_value = [store(1, "Aldi"), store(2, "Tesco")]

    response = client.get(STORES_URL, headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == [
        {"OHID": 1, "name": "Aldi", "householdId": 5, "createdAt": "2026-10-27T00:00:00Z"},
        {"OHID": 2, "name": "Tesco", "householdId": 5, "createdAt": "2026-10-27T00:00:00Z"},
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
    assert new_store.to_row() == {"stor_name": "Tesco", "stor_household_id": 5}


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
