"""
Edited notifications (#26), against the live Supabase project: one save that
changes an item's details gives every other member one notification listing
each change, old → new, under the item's new name. Empty values read "Empty",
a notes change reads "updated the notes", a move names both shopping lists,
and a save that changes nothing sends nothing.
Run with:  pytest -m integration
"""

from types import SimpleNamespace

import pytest

from items.ItemDAO import ItemDAO
from lists.ListDAO import ListDAO
from notifications.NotifDAO import NotificationDAO
from schema import Item, ItemEvent, Priority, ShoppingList, Store
from stores.StoreDAO import StoreDAO

pytestmark = pytest.mark.integration


def _edits(token):
    return [n for n in NotificationDAO().fetch_inbox(token) if n.event is ItemEvent.EDITED]


@pytest.fixture()
def milk(shared_household):
    """Milk (quantity 1, low priority, from Tesco) added by Alex; Aldi is another store."""
    (_, alex_token), (_, sam_token), home, shopping_list = shared_household
    stores = StoreDAO()
    tesco = stores.create_store(alex_token, Store(name="Tesco", household_id=home.id))
    aldi = stores.create_store(alex_token, Store(name="Aldi", household_id=home.id))
    item = ItemDAO().create_item(alex_token, Item(
        name="Milk", list_id=shopping_list.id, quantity=1, priority=Priority.LOW, store_id=tesco.id))
    return SimpleNamespace(
        item=item, list=shopping_list, home=home, tesco=tesco, aldi=aldi,
        alex_token=alex_token, sam_token=sam_token,
    )


def _edit(milk, changes, token=None):
    ItemDAO().update_item(token or milk.alex_token, milk.list.id, milk.item.id, changes)


def test_one_save_lists_every_change_under_the_new_name(milk):
    _edit(milk, {"name": "Oat milk", "quantity": 2, "priority": Priority.HIGH.value, "store_id": milk.aldi.id})

    (notification,) = _edits(milk.sam_token)
    assert notification.sentence == (
        "Alex changed Oat milk: name Milk → Oat milk, quantity 1 → 2, priority Low → High, store Tesco → Aldi")
    assert notification.item_name == "Oat milk"
    assert notification.changes == [
        {"field": "name", "old": "Milk", "new": "Oat milk"},
        {"field": "quantity", "old": "1", "new": "2"},
        {"field": "priority", "old": "Low", "new": "High"},
        {"field": "store", "old": "Tesco", "new": "Aldi"},
    ]
    assert _edits(milk.alex_token) == []


def test_an_empty_store_or_quantity_reads_empty(milk):
    _edit(milk, {"quantity": None, "store_id": None})
    _edit(milk, {"quantity": 3, "store_id": milk.aldi.id})

    assert [n.sentence for n in _edits(milk.sam_token)] == [
        "Alex changed Milk: quantity Empty → 3, store Empty → Aldi",
        "Alex changed Milk: quantity 1 → Empty, store Tesco → Empty",
    ]


def test_a_notes_change_does_not_repeat_the_text(milk):
    _edit(milk, {"notes": "semi-skimmed"})
    _edit(milk, {"notes": "whole", "quantity": 2})

    newest, oldest = _edits(milk.sam_token)
    assert oldest.sentence == "Alex updated the notes on Milk"
    assert oldest.changes == [{"field": "notes", "old": None, "new": None}]
    assert newest.sentence == "Alex changed Milk: quantity 1 → 2, updated the notes"


def test_moving_an_item_names_both_shopping_lists(milk):
    weekend = ListDAO().create_list(milk.alex_token, ShoppingList(name="Weekend shop", household_id=milk.home.id))

    _edit(milk, {"list_id": weekend.id})
    ItemDAO().update_item(milk.alex_token, weekend.id, milk.item.id, {"list_id": milk.list.id, "quantity": 2})

    newest, oldest = _edits(milk.sam_token)
    assert oldest.sentence == "Alex moved Milk from Weekly shop to Weekend shop"
    assert oldest.list_id == weekend.id
    assert newest.sentence == "Alex changed Milk: moved from Weekend shop to Weekly shop, quantity 1 → 2"


def test_ticking_with_another_change_is_one_edit_that_includes_it(milk):
    _edit(milk, {"bought": True, "quantity": 2})

    (notification,) = _edits(milk.sam_token)
    assert notification.sentence == "Alex changed Milk: quantity 1 → 2, ticked as bought"
    assert [n for n in NotificationDAO().fetch_inbox(milk.sam_token) if n.event is ItemEvent.BOUGHT] == []


def test_a_save_that_changes_nothing_sends_nothing(milk):
    _edit(milk, {"name": "Milk", "quantity": 1, "store_id": milk.tesco.id})

    assert _edits(milk.sam_token) == []


def test_deleting_a_store_does_not_send_an_edit_for_its_items(admin, milk):
    # No delete-store route yet; the database clears the store from its items
    admin.table(Store.db_table()).delete().eq(Store.column("id"), milk.tesco.id).execute()

    assert ItemDAO().fetch_item(milk.alex_token, milk.list.id, milk.item.id).store_id is None
    assert _edits(milk.sam_token) == []


def test_renaming_later_does_not_rewrite_earlier_notifications(milk):
    _edit(milk, {"name": "Oat milk"})

    sentences = [n.sentence for n in NotificationDAO().fetch_inbox(milk.sam_token)]
    assert sentences == ["Alex changed Oat milk: name Milk → Oat milk", "Alex added Milk"]
