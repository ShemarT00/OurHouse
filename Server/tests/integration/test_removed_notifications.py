"""
Removed notifications (#27), against the live Supabase project: removing an
item tells every other member "<first name> removed <item>", and the
notification still reads correctly once the item is gone. Items deleted with
their whole shopping list or household send nothing.
Run with:  pytest -m integration
"""

import pytest

from items.ItemDAO import ItemDAO
from notifications.NotifDAO import NotificationDAO
from schema import Household, Item, ItemEvent, ShoppingList
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


def _removals(token):
    return [n for n in NotificationDAO().fetch_inbox(token) if n.event is ItemEvent.REMOVED]


def test_removing_an_item_tells_other_members_and_survives_the_item(shared_household):
    (alex_id, alex_token), (sam_id, sam_token), home, shopping_list = shared_household
    milk = ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))

    assert ItemDAO().delete_item(sam_token, shopping_list.id, milk.id)

    (notification,) = _removals(alex_token)
    assert notification.sentence == "Sam removed Milk"
    assert (notification.user_id, notification.actor_id) == (alex_id, sam_id)
    assert (notification.household_id, notification.list_id, notification.item_id, notification.item_name) == (
        home.id, shopping_list.id, None, "Milk")
    assert _removals(sam_token) == []


def test_earlier_notifications_lose_their_item_link_but_keep_their_wording(shared_household):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    milk = ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))

    ItemDAO().delete_item(alex_token, shopping_list.id, milk.id)

    removed, added = NotificationDAO().fetch_inbox(sam_token)
    assert (removed.sentence, added.sentence) == ("Alex removed Milk", "Alex added Milk")
    assert (added.item_id, added.list_id) == (None, shopping_list.id)


def test_clearing_bought_items_gives_one_removal_per_item(shared_household):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    dao = ItemDAO()
    for name in ("Milk", "Bread"):
        item = dao.create_item(alex_token, Item(name=name, list_id=shopping_list.id))
        dao.update_item(alex_token, shopping_list.id, item.id, {"bought": True})
    dao.create_item(alex_token, Item(name="Eggs", list_id=shopping_list.id))

    # No clear-completed route yet: one delete of every bought item, as Alex
    (get_user_client(alex_token).table(Item.db_table()).delete()
     .eq(Item.column("list_id"), shopping_list.id).eq(Item.column("bought"), True).execute())

    assert sorted(n.sentence for n in _removals(sam_token)) == ["Alex removed Bread", "Alex removed Milk"]


def test_deleting_a_shopping_list_sends_nothing_for_its_items(admin, shared_household):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    for name in ("Milk", "Bread"):
        ItemDAO().create_item(alex_token, Item(name=name, list_id=shopping_list.id))

    # No delete-list route yet
    admin.table(ShoppingList.db_table()).delete().eq(ShoppingList.column("id"), shopping_list.id).execute()

    assert _removals(sam_token) == []
    assert _removals(alex_token) == []


def test_deleting_a_household_sends_nothing_for_its_items(admin, shared_household):
    (_, alex_token), (_, sam_token), home, shopping_list = shared_household
    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))

    # No delete-household route yet; this would fail if the trigger wrote to the deleted household
    admin.table(Household.db_table()).delete().eq(Household.column("id"), home.id).execute()

    assert _removals(sam_token) == []
    assert _removals(alex_token) == []
