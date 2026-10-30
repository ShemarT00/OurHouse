"""
Notification routes: the inbox.
Supabase is mocked: require_auth's token check and the notification DAO.
Who receives which notification is decided by the database trigger, so those
rules are tested against Supabase in tests/integration/test_added_notifications.py.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import ItemEvent, Notification

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
ACTOR_ID = "2b1f0c3e-0000-4000-8000-000000000002"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture()
def signed_in(monkeypatch):
    admin = MagicMock()
    admin.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=USER_ID))
    monkeypatch.setattr("auth.decorators.get_admin_client", lambda: admin)


@pytest.fixture()
def fetch_inbox(monkeypatch):
    fetch = MagicMock(return_value=[])
    monkeypatch.setattr("notifications.NotifDAO.NotificationDAO.fetch_inbox", fetch)
    return fetch


def notification(id, item_name, created_at, read=False):
    return Notification(
        id=id, user_id=USER_ID, household_id=5, event=ItemEvent.ADDED, item_name=item_name,
        sentence=f"Alex added {item_name}", list_id=3, item_id=10 + id, actor_id=ACTOR_ID,
        read=read, created_at=created_at,
    )


def test_inbox_requires_a_token(client):
    assert client.get("/api/notifications").status_code == 401


def test_inbox_returns_the_members_notifications_in_the_order_given(client, signed_in, fetch_inbox):
    fetch_inbox.return_value = [
        notification(2, "Bread", "2026-10-29T10:00:00Z"),
        notification(1, "Milk", "2026-10-28T10:00:00Z", read=True),
    ]

    response = client.get("/api/notifications", headers=AUTH)

    assert response.status_code == 200
    body = response.get_json()
    assert [(n["OHID"], n["sentence"], n["read"]) for n in body] == [
        (2, "Alex added Bread", False),
        (1, "Alex added Milk", True),
    ]
    assert body[0] == {
        "OHID": 2, "userId": USER_ID, "householdId": 5, "event": "added", "itemName": "Bread",
        "sentence": "Alex added Bread", "listId": 3, "itemId": 12, "actorId": ACTOR_ID,
        "changes": [], "read": False, "createdAt": "2026-10-29T10:00:00Z",
    }
    fetch_inbox.assert_called_once_with("good-token")


def test_empty_inbox(client, signed_in, fetch_inbox):
    response = client.get("/api/notifications", headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == []


def test_notification_from_row_converts_the_event():
    row = notification(1, "Milk", "2026-10-28T10:00:00Z").to_row()
    assert row["noti_event"] == "added"
    assert Notification.from_row(row).event is ItemEvent.ADDED
