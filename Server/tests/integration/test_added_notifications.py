"""
"Added" notifications (#24), against the live Supabase project: when a member
adds an item, every other member of the household gets one notification
reading "<first name> added <item>" in their inbox. The actor, members of
other households and members who join later get nothing, and no one can
create notifications directly.
Run with:  pytest -m integration
"""

from datetime import datetime, timedelta, timezone

import pytest
from postgrest.exceptions import APIError

from households.HouseholdDAO import HouseholdDAO
from items.ItemDAO import ItemDAO
from notifications.NotifDAO import NotificationDAO
from schema import Item, ItemEvent, Notification
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


def _inbox(token):
    return NotificationDAO().fetch_inbox(token)


def test_other_members_are_told_who_added_what(shared_household):
    (alex_id, alex_token), (sam_id, sam_token), home, shopping_list = shared_household

    milk = ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))

    (notification,) = _inbox(sam_token)
    assert notification.sentence == "Alex added Milk"
    assert (notification.user_id, notification.actor_id) == (sam_id, alex_id)
    assert (notification.event, notification.item_name) == (ItemEvent.ADDED, "Milk")
    assert (notification.household_id, notification.list_id, notification.item_id) == (
        home.id, shopping_list.id, milk.id)
    assert notification.read is False


def test_the_actor_is_not_notified(shared_household):
    (_, alex_token), _, _, shopping_list = shared_household

    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))

    assert _inbox(alex_token) == []


def test_other_households_get_nothing_and_cannot_read_anothers_notifications(make_user, shared_household):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    _, outsider_token = make_user("Outsider")

    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))
    (sams,) = _inbox(sam_token)

    assert _inbox(outsider_token) == []
    # Even asking for Sam's notification by its id returns nothing
    direct = (
        get_user_client(outsider_token).table(Notification.db_table())
        .select("*").eq(Notification.column("id"), sams.id).execute()
    )
    assert direct.data == []


def test_a_member_who_joins_later_does_not_get_earlier_changes(make_user, shared_household):
    (_, alex_token), _, home, shopping_list = shared_household

    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))
    _, late_token = make_user("Late")
    HouseholdDAO().join_household(late_token, home.invite_code)

    assert _inbox(late_token) == []


def test_a_change_with_no_signed_in_user_is_from_someone_and_notifies_everyone(admin, shared_household):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household

    # The service key has no signed-in user, like a change made in the SQL editor
    admin.table(Item.db_table()).insert(Item(name="Bread", list_id=shopping_list.id).to_row()).execute()

    for token in (alex_token, sam_token):
        (notification,) = _inbox(token)
        assert notification.sentence == "Someone added Bread"
        assert notification.actor_id is None


def test_inbox_is_newest_first_and_only_the_last_30_days(admin, shared_household):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    dao = ItemDAO()
    for name in ("Old eggs", "Milk", "Bread"):
        dao.create_item(alex_token, Item(name=name, list_id=shopping_list.id))
    (_, _, old) = _inbox(sam_token)
    assert old.item_name == "Old eggs"

    back_dated = (datetime.now(timezone.utc) - timedelta(days=31)).isoformat()
    admin.table(Notification.db_table()).update({Notification.column("created_at"): back_dated}).eq(
        Notification.column("id"), old.id).execute()

    assert [n.sentence for n in _inbox(sam_token)] == ["Alex added Bread", "Alex added Milk"]


def test_members_cannot_create_notifications(shared_household):
    (alex_id, alex_token), (sam_id, sam_token), home, shopping_list = shared_household
    forged = Notification(
        user_id=alex_id, household_id=home.id, event=ItemEvent.ADDED, item_name="Cake",
        sentence="Sam added Cake", list_id=shopping_list.id, actor_id=sam_id,
    )

    with pytest.raises(APIError) as error:
        get_user_client(sam_token).table(Notification.db_table()).insert(forged.to_row()).execute()

    assert error.value.code == "42501"  # RLS refused the row
    assert _inbox(alex_token) == []
