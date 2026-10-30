"""
Read and unread (#28), against the live Supabase project: a member's unread
count covers the last 30 days, and a member can mark one or all of their own
notifications read, but cannot mark another member's or change anything else.
Run with:  pytest -m integration
"""

from datetime import datetime, timedelta, timezone

import pytest
from postgrest.exceptions import APIError

from items.ItemDAO import ItemDAO
from notifications.NotifDAO import NotificationDAO
from schema import Item, Notification
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


@pytest.fixture()
def inboxes(shared_household):
    """Alex adds Milk and Bread, so Sam has two unread notifications; returns (alex token, sam token)."""
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    for name in ("Milk", "Bread"):
        ItemDAO().create_item(alex_token, Item(name=name, list_id=shopping_list.id))
    return alex_token, sam_token


def test_unread_count_counts_only_the_last_30_days(admin, inboxes):
    _, sam_token = inboxes
    dao = NotificationDAO()
    _, milk = dao.fetch_inbox(sam_token)
    old = (datetime.now(timezone.utc) - timedelta(days=31)).isoformat()
    admin.table(Notification.db_table()).update({Notification.column("created_at"): old}).eq(
        Notification.column("id"), milk.id).execute()

    assert dao.count_unread(sam_token) == 1


def test_marking_one_read_changes_the_count(inboxes):
    _, sam_token = inboxes
    dao = NotificationDAO()
    bread, milk = dao.fetch_inbox(sam_token)

    marked = dao.mark_read(sam_token, milk.id)

    assert (marked.id, marked.read) == (milk.id, True)
    assert dao.count_unread(sam_token) == 1
    assert [n.read for n in dao.fetch_inbox(sam_token)] == [False, True]


def test_a_member_cannot_mark_another_members_notification(inboxes):
    alex_token, sam_token = inboxes
    dao = NotificationDAO()
    bread, _ = dao.fetch_inbox(sam_token)

    assert dao.mark_read(alex_token, bread.id) is None
    assert dao.count_unread(sam_token) == 2


def test_mark_all_read(inboxes):
    _, sam_token = inboxes
    dao = NotificationDAO()

    assert dao.mark_all_read(sam_token) == 2
    assert dao.count_unread(sam_token) == 0
    assert dao.mark_all_read(sam_token) == 0


def test_a_member_can_change_only_the_read_flag(inboxes):
    _, sam_token = inboxes
    bread, _ = NotificationDAO().fetch_inbox(sam_token)

    with pytest.raises(APIError) as error:
        (get_user_client(sam_token).table(Notification.db_table())
         .update({Notification.column("sentence"): "Alex added Cake"})
         .eq(Notification.column("id"), bread.id).execute())

    assert error.value.code == "42501"  # no UPDATE grant on that column
    assert NotificationDAO().fetch_inbox(sam_token)[0].sentence == "Alex added Bread"
