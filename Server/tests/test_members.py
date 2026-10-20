"""
GET /api/households/<id>/members: every member of a household the caller belongs to.
Supabase is mocked: require_auth's token check and the member DAO.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import Member

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
OTHER_ID = "2b1f0c3e-0000-4000-8000-000000000002"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture()
def signed_in(monkeypatch):
    admin = MagicMock()
    admin.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=USER_ID))
    monkeypatch.setattr("auth.decorators.get_admin_client", lambda: admin)


@pytest.fixture()
def fetch_members(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("members.MemberDAO.MemberDAO.fetch_members", mock)
    return mock


def test_members_require_a_token(client):
    assert client.get("/api/households/1/members").status_code == 401


def test_lists_every_member(client, signed_in, fetch_members):
    fetch_members.return_value = [
        Member(id=1, user_id=USER_ID, household_id=5, first_name="Jane", last_name="Doe", is_admin=True,
               created_at="2026-10-20T00:00:00Z"),
        Member(id=2, user_id=OTHER_ID, household_id=5, first_name="Sam", last_name="Lee", is_admin=False,
               created_at="2026-10-21T00:00:00Z"),
    ]

    response = client.get("/api/households/5/members", headers=AUTH)

    assert response.status_code == 200
    body = response.get_json()
    assert [(m["firstName"], m["isAdmin"], m["userId"]) for m in body] == [
        ("Jane", True, USER_ID),
        ("Sam", False, OTHER_ID),
    ]
    fetch_members.assert_called_once_with("good-token", 5)


def test_non_member_or_unknown_household_is_404(client, signed_in, fetch_members):
    fetch_members.return_value = []
    assert client.get("/api/households/5/members", headers=AUTH).status_code == 404
