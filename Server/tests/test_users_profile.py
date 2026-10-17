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
