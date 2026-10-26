"""
Shopping list routes: list a household's lists, create one, get one.
Supabase is mocked: require_auth's token check, the list DAO and the
household lookup used to tell "no lists yet" from "not a member".
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import Household, ShoppingList

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
AUTH = {"Authorization": "Bearer good-token"}
LISTS_URL = "/api/households/5/shopping-lists"


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
    mocks = SimpleNamespace(list=MagicMock(), get=MagicMock(), create=MagicMock())
    monkeypatch.setattr("lists.ListDAO.ListDAO.fetch_lists", mocks.list)
    monkeypatch.setattr("lists.ListDAO.ListDAO.fetch_list", mocks.get)
    monkeypatch.setattr("lists.ListDAO.ListDAO.create_list", mocks.create)
    return mocks


def shopping_list(id=1, name="Weekly shop"):
    return ShoppingList(id=id, name=name, household_id=5, created_at="2026-10-26T00:00:00Z")


@pytest.mark.parametrize("method,path", [("GET", LISTS_URL), ("POST", LISTS_URL), ("GET", LISTS_URL + "/1")])
def test_list_routes_require_a_token(client, method, path):
    assert client.open(path, method=method, json={"name": "x"}).status_code == 401


def test_lists_a_households_lists(client, signed_in, member_of_household, dao):
    dao.list.return_value = [shopping_list(1, "Weekly shop"), shopping_list(2, "Party")]

    response = client.get(LISTS_URL, headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == [
        {"OHID": 1, "name": "Weekly shop", "householdId": 5, "createdAt": "2026-10-26T00:00:00Z"},
        {"OHID": 2, "name": "Party", "householdId": 5, "createdAt": "2026-10-26T00:00:00Z"},
    ]
    dao.list.assert_called_once_with("good-token", 5)


def test_member_with_no_lists_gets_an_empty_array(client, signed_in, member_of_household, dao):
    dao.list.return_value = []
    response = client.get(LISTS_URL, headers=AUTH)
    assert response.status_code == 200
    assert response.get_json() == []


def test_non_member_gets_404_for_lists(client, signed_in, not_a_member, dao):
    assert client.get(LISTS_URL, headers=AUTH).status_code == 404
    dao.list.assert_not_called()


def test_create_list(client, signed_in, member_of_household, dao):
    dao.create.return_value = shopping_list(3, "Weekly shop")

    response = client.post(LISTS_URL, json={"name": "  Weekly shop "}, headers=AUTH)

    assert response.status_code == 201
    assert response.get_json()["OHID"] == 3
    token, new_list = dao.create.call_args.args
    assert token == "good-token"
    assert new_list.to_row() == {"shop_name": "Weekly shop", "shop_household_id": 5}


@pytest.mark.parametrize("body", [{}, {"name": ""}, {"name": "  "}, {"name": 7}, {"name": "x" * 256}])
def test_create_list_rejects_invalid_names(client, signed_in, member_of_household, dao, body):
    assert client.post(LISTS_URL, json=body, headers=AUTH).status_code == 400
    dao.create.assert_not_called()


def test_non_member_cannot_create_a_list(client, signed_in, not_a_member, dao):
    assert client.post(LISTS_URL, json={"name": "Sneaky"}, headers=AUTH).status_code == 404
    dao.create.assert_not_called()


def test_get_list(client, signed_in, dao):
    dao.get.return_value = shopping_list(3)
    response = client.get(LISTS_URL + "/3", headers=AUTH)
    assert response.status_code == 200
    assert response.get_json()["OHID"] == 3
    dao.get.assert_called_once_with("good-token", 5, 3)


def test_get_list_not_found_is_404(client, signed_in, dao):
    dao.get.return_value = None
    assert client.get(LISTS_URL + "/3", headers=AUTH).status_code == 404
