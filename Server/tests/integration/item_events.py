"""Helpers for integration tests about which item events reach whom."""

from items.ItemDAO import ItemDAO
from notifications.NotifDAO import NotificationDAO
from schema import Item, ItemEvent

# The event each step of do_every_item_event() causes, in order
EVERY_ITEM_EVENT = [ItemEvent.ADDED, ItemEvent.EDITED, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT, ItemEvent.REMOVED]


def inbox_events(token):
    """The member's notifications, oldest first, as (event, sentence)."""
    return [(n.event, n.sentence) for n in reversed(NotificationDAO().fetch_inbox(token))]


def do_every_item_event(token, list_id, name="Milk"):
    """Add, edit, tick, untick and remove an item: one of each of the five item events."""
    dao = ItemDAO()
    item = dao.create_item(token, Item(name=name, list_id=list_id))
    dao.update_item(token, list_id, item.id, {"quantity": 2})
    dao.update_item(token, list_id, item.id, {"bought": True})
    dao.update_item(token, list_id, item.id, {"bought": False})
    dao.delete_item(token, list_id, item.id)
