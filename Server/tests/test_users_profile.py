"""
GET /api/users/profile returns the signed-in user's profile row.
Supabase is mocked: require_auth's token check and the user DAO.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import ItemEvent, User

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"


@pytest.fixture()
def signed_in(monkeypatch):
    """Make require_auth accept 'Bearer good-token' as USER_ID."""
    admin = MagicMock()

    def get_user(token):
        if token != "good-token":
            raise RuntimeError("invalid JWT")
        return SimpleNamespace(user=SimpleNamespace(id=USER_ID))

    admin.auth.get_user.side_effect = get_user
    monkeypatch.setattr("auth.decorators.get_admin_client", lambda: admin)


@pytest.fixture()
def fetch_user(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("users.UserDAO.UserDAO.fetch_user", mock)
    return mock


def test_profile_requires_a_token(client):
    response = client.get("/api/users/profile")
    assert response.status_code == 401


def test_profile_rejects_an_invalid_token(client, signed_in):
    response = client.get("/api/users/profile", headers={"Authorization": "Bearer bad-token"})
    assert response.status_code == 401


def test_profile_returns_signed_in_user(client, signed_in, fetch_user):
    fetch_user.return_value = User(
        id=USER_ID, name="Jane Doe", email="jane@example.com", created_at="2026-10-17T00:00:00Z"
    )

    response = client.get("/api/users/profile", headers={"Authorization": "Bearer good-token"})

    assert response.status_code == 200
    assert response.get_json() == {
        "OHID": USER_ID,
        "name": "Jane Doe",
        "email": "jane@example.com",
        "createdAt": "2026-10-17T00:00:00Z",
        "switchedOffEvents": [],
    }
    # Queried as the user (token passed through so RLS applies), for their own ID
    fetch_user.assert_called_once_with("good-token", USER_ID)


def test_profile_missing_row_is_404(client, signed_in, fetch_user):
    fetch_user.return_value = None
    response = client.get("/api/users/profile", headers={"Authorization": "Bearer good-token"})
    assert response.status_code == 404
    assert response.get_json()["error"] == "Not Found"


# PUT /api/users/profile updates the signed-in user's name.

AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture()
def update_name(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("users.UserDAO.UserDAO.update_name", mock)
    return mock


def test_update_name_requires_a_token(client):
    response = client.put("/api/users/profile", json={"name": "Jane"})
    assert response.status_code == 401


def test_update_name_saves_trimmed_name(client, signed_in, update_name):
    update_name.return_value = User(
        id=USER_ID, name="Jane Smith", email="jane@example.com", created_at="2026-10-17T00:00:00Z"
    )

    response = client.put("/api/users/profile", json={"name": "  Jane Smith "}, headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == {
        "OHID": USER_ID,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "createdAt": "2026-10-17T00:00:00Z",
        "switchedOffEvents": [],
    }
    update_name.assert_called_once_with("good-token", USER_ID, "Jane Smith")


def test_update_name_rejects_blank(client, signed_in, update_name):
    response = client.put("/api/users/profile", json={"name": "   "}, headers=AUTH)

    assert response.status_code == 400
    assert response.get_json()["message"] == "Name must be 1-255 characters"
    update_name.assert_not_called()


def test_update_name_rejects_too_long(client, signed_in, update_name):
    response = client.put("/api/users/profile", json={"name": "a" * 256}, headers=AUTH)

    assert response.status_code == 400
    update_name.assert_not_called()


@pytest.mark.parametrize("body", [{}, {"name": 5}])
def test_update_name_rejects_missing_or_non_string(client, signed_in, update_name, body):
    response = client.put("/api/users/profile", json=body, headers=AUTH)

    assert response.status_code == 400
    update_name.assert_not_called()


def test_update_name_ignores_email(client, signed_in, update_name):
    update_name.return_value = User(id=USER_ID, name="Jane", email="jane@example.com", created_at="")

    response = client.put("/api/users/profile", json={"name": "Jane", "email": "x@y.z"}, headers=AUTH)

    assert response.status_code == 200
    update_name.assert_called_once_with("good-token", USER_ID, "Jane")


def test_update_name_missing_row_is_404(client, signed_in, update_name):
    update_name.return_value = None
    response = client.put("/api/users/profile", json={"name": "Jane"}, headers=AUTH)
    assert response.status_code == 404


def test_profile_includes_the_switched_off_events(client, signed_in, fetch_user):
    fetch_user.return_value = User(
        id=USER_ID, name="Jane", email="jane@example.com", created_at="",
        switched_off_events=[ItemEvent.BOUGHT, ItemEvent.UNBOUGHT],
    )

    body = client.get("/api/users/profile", headers=AUTH).get_json()

    assert body["switchedOffEvents"] == ["bought", "unbought"]


# PUT /api/users/profile/switched-off-events replaces the account's Switched-off Events (#63)

SWITCHED_OFF = "/api/users/profile/switched-off-events"


@pytest.fixture()
def set_switched_off(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("users.UserDAO.UserDAO.set_switched_off_events", mock)
    return mock


def test_switching_off_events_requires_a_token(client):
    assert client.put(SWITCHED_OFF, json={"switchedOffEvents": []}).status_code == 401


def test_switching_off_events_saves_them_and_returns_the_profile(client, signed_in, set_switched_off):
    set_switched_off.return_value = User(
        id=USER_ID, name="Jane", email="jane@example.com", created_at="2026-10-17T00:00:00Z",
        switched_off_events=[ItemEvent.EDITED, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT],
    )

    response = client.put(
        SWITCHED_OFF, json={"switchedOffEvents": ["unbought", "edited", "bought", "edited"]}, headers=AUTH
    )

    assert response.status_code == 200
    assert response.get_json() == {
        "OHID": USER_ID,
        "name": "Jane",
        "email": "jane@example.com",
        "createdAt": "2026-10-17T00:00:00Z",
        "switchedOffEvents": ["edited", "bought", "unbought"],
    }
    # Each event once, in the usual order
    set_switched_off.assert_called_once_with(
        "good-token", USER_ID, [ItemEvent.EDITED, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT]
    )


def test_switching_every_event_back_on_saves_an_empty_list(client, signed_in, set_switched_off):
    set_switched_off.return_value = User(id=USER_ID, name="Jane", email="jane@example.com", created_at="")

    response = client.put(SWITCHED_OFF, json={"switchedOffEvents": []}, headers=AUTH)

    assert response.status_code == 200
    set_switched_off.assert_called_once_with("good-token", USER_ID, [])


@pytest.mark.parametrize("body", [
    {"switchedOffEvents": ["added", "sold"]},  # unknown event
    {"switchedOffEvents": "added"},            # not a list
    {"switchedOffEvents": [3]},
    {"switchedOffEvents": None},
    {},
    ["added"],                                 # not an object
])
def test_switching_off_anything_but_a_list_of_known_events_is_400(client, signed_in, set_switched_off, body):
    response = client.put(SWITCHED_OFF, json=body, headers=AUTH)

    assert response.status_code == 400
    assert response.get_json()["error"] == "Bad Request"
    set_switched_off.assert_not_called()


def test_switching_off_events_with_no_profile_row_is_404(client, signed_in, set_switched_off):
    set_switched_off.return_value = None
    assert client.put(SWITCHED_OFF, json={"switchedOffEvents": []}, headers=AUTH).status_code == 404
