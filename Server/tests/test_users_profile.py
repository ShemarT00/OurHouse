"""
GET /api/users/profile returns the signed-in user's profile row.
Supabase is mocked: require_auth's token check and the user DAO.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import User

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
