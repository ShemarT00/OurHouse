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


def test_member_list_does_not_show_who_has_muted_the_household(client, signed_in, fetch_members):
    fetch_members.return_value = [
        Member(id=1, user_id=USER_ID, household_id=5, first_name="Jane", last_name="Doe", muted=True),
        Member(id=2, user_id=OTHER_ID, household_id=5, first_name="Sam", last_name="Lee", muted=False),
    ]

    body = client.get("/api/households/5/members", headers=AUTH).get_json()

    assert all("muted" not in m for m in body)


def test_non_member_or_unknown_household_is_404(client, signed_in, fetch_members):
    fetch_members.return_value = []
    assert client.get("/api/households/5/members", headers=AUTH).status_code == 404


# PUT /api/households/<id>/muted: mute or unmute the caller's own membership (#62)

@pytest.fixture()
def set_muted(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("members.MemberDAO.MemberDAO.set_muted", mock)
    return mock


def test_muting_requires_a_token(client):
    assert client.put("/api/households/5/muted", json={"muted": True}).status_code == 401


@pytest.mark.parametrize("muted", [True, False])
def test_mutes_or_unmutes_the_callers_membership(client, signed_in, set_muted, muted):
    set_muted.return_value = muted

    response = client.put("/api/households/5/muted", json={"muted": muted}, headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == {"householdId": 5, "muted": muted}
    set_muted.assert_called_once_with("good-token", 5, muted)


def test_muting_a_household_you_are_not_in_is_404(client, signed_in, set_muted):
    set_muted.return_value = None

    response = client.put("/api/households/5/muted", json={"muted": True}, headers=AUTH)

    assert response.status_code == 404
    assert set(response.get_json()) == {"error", "message"}


@pytest.mark.parametrize("body", [{}, {"muted": "yes"}, {"muted": 1}, {"muted": None}, ["muted"]])
def test_muted_must_be_true_or_false(client, signed_in, set_muted, body):
    response = client.put("/api/households/5/muted", json=body, headers=AUTH)

    assert response.status_code == 400
    set_muted.assert_not_called()
