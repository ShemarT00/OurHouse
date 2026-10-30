"""
Bought and Un-bought notifications (#25), against the live Supabase project:
a save that only ticks an item tells every other member "<first name> bought
<item>", and one that only unticks it tells them "<first name> un-ticked
<item>". The actor is not notified.
Run with:  pytest -m integration
"""

import pytest

from items.ItemDAO import ItemDAO
from notifications.NotifDAO import NotificationDAO
from schema import Item, ItemEvent

pytestmark = pytest.mark.integration


def _inbox(token, *events):
    """The member's notifications for these events only (the item's Added one is left out)."""
    return [n for n in NotificationDAO().fetch_inbox(token) if n.event in events]


@pytest.fixture()
def milk(shared_household):
    """Milk, added by Alex to the shared list."""
    (_, alex_token), _, _, shopping_list = shared_household
    return ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))


def test_ticking_an_item_tells_other_members_who_bought_it(shared_household, milk):
    (alex_id, alex_token), (sam_id, sam_token), home, shopping_list = shared_household

    ItemDAO().update_item(sam_token, shopping_list.id, milk.id, {"bought": True})

    (notification,) = _inbox(alex_token, ItemEvent.BOUGHT)
    assert notification.sentence == "Sam bought Milk"
    assert (notification.user_id, notification.actor_id) == (alex_id, sam_id)
    assert (notification.household_id, notification.list_id, notification.item_id, notification.item_name) == (
        home.id, shopping_list.id, milk.id, "Milk")
    assert _inbox(sam_token, ItemEvent.BOUGHT) == []


def test_unticking_an_item_tells_other_members_it_still_needs_buying(shared_household, milk):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household
    dao = ItemDAO()
    dao.update_item(alex_token, shopping_list.id, milk.id, {"bought": True})

    dao.update_item(alex_token, shopping_list.id, milk.id, {"bought": False})

    assert [n.sentence for n in _inbox(sam_token, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT)] == [
        "Alex un-ticked Milk",
        "Alex bought Milk",
    ]
    assert _inbox(alex_token, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT) == []


def test_a_save_that_does_not_change_the_bought_flag_sends_nothing(shared_household, milk):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household

    ItemDAO().update_item(alex_token, shopping_list.id, milk.id, {"bought": False})

    assert _inbox(sam_token, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT) == []


def test_ticking_together_with_another_change_is_not_a_bought_notification(shared_household, milk):
    (_, alex_token), (_, sam_token), _, shopping_list = shared_household

    # Spec: this is one Edited notification that includes the bought change (#26)
    ItemDAO().update_item(alex_token, shopping_list.id, milk.id, {"bought": True, "quantity": 2})

    assert _inbox(sam_token, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT) == []
