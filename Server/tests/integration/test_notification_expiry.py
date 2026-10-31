"""
Notification expiry and leavers (#30), against the live Supabase project:
notifications older than 30 days are hidden from the inbox and deleted by the
nightly job, and a member who leaves a household loses their notifications
for that household only.
The job's function is called directly, rather than waiting for pg_cron.
Run with:  pytest -m integration
"""

from datetime import datetime, timedelta, timezone

import pytest
from postgrest.exceptions import APIError

from households.HouseholdDAO import HouseholdDAO
from items.ItemDAO import ItemDAO
from lists.ListDAO import ListDAO
from notifications.NotifDAO import NotificationDAO
from schema import Item, Member, Notification, ShoppingList
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


def _exists(admin, notification_id):
    response = (admin.table(Notification.db_table()).select(Notification.column("id"))
                .eq(Notification.column("id"), notification_id).execute())
    return bool(response.data)


def test_an_expired_notification_is_hidden_then_deleted_by_the_nightly_job(admin, shared_household):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    for name in ("Milk", "Bread"):
        ItemDAO().create_item(alex_token, Item(name=name, list_id=shopping_list.id))
    bread, milk = NotificationDAO().fetch_inbox(sam_token)
    old = (datetime.now(timezone.utc) - timedelta(days=31)).isoformat()
    admin.table(Notification.db_table()).update({Notification.column("created_at"): old}).eq(
        Notification.column("id"), milk.id).execute()

    # Hidden before the job runs
    assert [n.id for n in NotificationDAO().fetch_inbox(sam_token)] == [bread.id]
    assert _exists(admin, milk.id)

    deleted = admin.rpc("delete_expired_notifications").execute().data

    assert deleted >= 1
    assert not _exists(admin, milk.id)
    assert _exists(admin, bread.id)


def test_members_cannot_run_the_expiry_job(shared_household):
    (_, alex_token), _, _, _ = shared_household

    with pytest.raises(APIError) as error:
        get_user_client(alex_token).rpc("delete_expired_notifications").execute()

    assert error.value.code == "42501"  # permission denied


def test_leaving_a_household_deletes_only_that_households_notifications(admin, shared_household, cleanup_households):
    (alex_id, alex_token), (sam_id, sam_token), home, shopping_list = shared_household
    other = HouseholdDAO().create_household(alex_token, "Other Test House")
    cleanup_households.append(other.id)
    HouseholdDAO().join_household(sam_token, other.invite_code)
    other_list = ListDAO().create_list(alex_token, ShoppingList(name="Holiday shop", household_id=other.id))
    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))
    ItemDAO().create_item(alex_token, Item(name="Sun cream", list_id=other_list.id))
    ItemDAO().create_item(sam_token, Item(name="Bread", list_id=shopping_list.id))

    # No remove-member route yet
    (admin.table(Member.db_table()).delete()
     .eq(Member.column("user_id"), sam_id).eq(Member.column("household_id"), home.id).execute())

    assert [n.sentence for n in NotificationDAO().fetch_inbox(sam_token)] == ["Alex added Sun cream"]
    assert [n.sentence for n in NotificationDAO().fetch_inbox(alex_token)] == ["Sam added Bread"]
