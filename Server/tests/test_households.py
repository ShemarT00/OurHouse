"""
Household routes: create (caller becomes admin, gets an invite code), list, get one.
Supabase is mocked: require_auth's token check and the household DAO.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import Household

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture()
def signed_in(monkeypatch):
    admin = MagicMock()
    admin.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=USER_ID))
    monkeypatch.setattr("auth.decorators.get_admin_client", lambda: admin)


@pytest.fixture()
def dao(monkeypatch):
    mocks = SimpleNamespace(create=MagicMock(), list=MagicMock(), get=MagicMock())
    monkeypatch.setattr("households.HouseholdDAO.HouseholdDAO.create_household", mocks.create)
    monkeypatch.setattr("households.HouseholdDAO.HouseholdDAO.fetch_households", mocks.list)
    monkeypatch.setattr("households.HouseholdDAO.HouseholdDAO.fetch_household", mocks.get)
    return mocks


def household(id=1, name="The Smiths"):
    return Household(
        id=id, name=name, invite_code="ABCD2345", created_by=USER_ID, created_at="2026-10-20T00:00:00Z"
    )


@pytest.mark.parametrize("method,path", [("GET", "/api/households"), ("POST", "/api/households"), ("GET", "/api/households/1")])
def test_household_routes_require_a_token(client, method, path):
    assert client.open(path, method=method, json={"name": "x"}).status_code == 401


def test_create_household_returns_it_with_invite_code(client, signed_in, dao):
    dao.create.return_value = household()

    response = client.post("/api/households", json={"name": "  The Smiths  "}, headers=AUTH)

    assert response.status_code == 201
    assert response.get_json() == {
        "OHID": 1,
        "name": "The Smiths",
        "inviteCode": "ABCD2345",
        "createdBy": USER_ID,
        "createdAt": "2026-10-20T00:00:00Z",
    }
    # Runs as the caller (token passed through so RLS / auth.uid() apply), with a trimmed name
    dao.create.assert_called_once_with("good-token", "The Smiths")


@pytest.mark.parametrize("body", [{}, {"name": ""}, {"name": "   "}, {"name": 42}, {"name": "x" * 256}])
def test_create_household_rejects_invalid_names(client, signed_in, dao, body):
    response = client.post("/api/households", json=body, headers=AUTH)
    assert response.status_code == 400
    assert response.get_json()["error"] == "Bad Request"
    dao.create.assert_not_called()


def test_list_households_returns_the_users_households(client, signed_in, dao):
    dao.list.return_value = [household(1, "The Smiths"), household(2, "Flat 4B")]

    response = client.get("/api/households", headers=AUTH)

    assert response.status_code == 200
    assert [h["name"] for h in response.get_json()] == ["The Smiths", "Flat 4B"]
    dao.list.assert_called_once_with("good-token")


def test_get_household(client, signed_in, dao):
    dao.get.return_value = household(7)
    response = client.get("/api/households/7", headers=AUTH)
    assert response.status_code == 200
    assert response.get_json()["OHID"] == 7
    dao.get.assert_called_once_with("good-token", 7)


def test_get_household_not_found_or_not_a_member_is_404(client, signed_in, dao):
    dao.get.return_value = None
    response = client.get("/api/households/7", headers=AUTH)
    assert response.status_code == 404


def test_household_to_row_leaves_invite_code_to_the_database():
    row = Household(name="The Smiths").to_row()
    assert row == {"hous_name": "The Smiths", "hous_created_by": None}
