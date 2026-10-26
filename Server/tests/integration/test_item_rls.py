"""
Row Level Security on ITEM (#8), against the live Supabase project: members
add, see, edit, tick and delete items; non-members can do none of it, even
when going straight to the database.
Run with:  pytest -m integration
"""

import pytest
from postgrest.exceptions import APIError

from households.HouseholdDAO import HouseholdDAO
from items.ItemDAO import ItemDAO
from lists.ListDAO import ListDAO
from schema import Item, Priority, ShoppingList
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


def _new_list(token, household_id, name):
    return ListDAO().create_list(token, ShoppingList(name=name, household_id=household_id))


@pytest.fixture()
def list_with_item(make_user, cleanup_households):
    """Owner's household, list and one item; returns (owner_token, household, list, item)."""
    _, owner_token = make_user("Owner")
    household = HouseholdDAO().create_household(owner_token, "Item Test House")
    cleanup_households.append(household.id)  # cascades to lists and items
    shopping_list = _new_list(owner_token, household.id, "Weekly shop")
    milk = ItemDAO().create_item(
        owner_token,
        Item(name="Milk", list_id=shopping_list.id, priority=Priority.HIGH, quantity=2, notes="semi-skimmed"),
    )
    return owner_token, household, shopping_list, milk


def test_member_adds_and_sees_items(list_with_item):
    owner_token, _, shopping_list, milk = list_with_item

    assert (milk.name, milk.quantity, milk.priority, milk.notes, milk.bought) == (
        "Milk", 2, Priority.HIGH, "semi-skimmed", False)
    assert ItemDAO().fetch_items(owner_token, shopping_list.id) == [milk]


def test_joined_member_sees_edits_ticks_and_deletes_items(make_user, list_with_item):
    _, household, shopping_list, milk = list_with_item
    _, joiner_token = make_user("Joiner")
    HouseholdDAO().join_household(joiner_token, household.invite_code)
    dao = ItemDAO()

    assert dao.fetch_items(joiner_token, shopping_list.id) == [milk]

    edited = dao.update_item(joiner_token, shopping_list.id, milk.id, {"name": "Oat milk", "quantity": None})
    assert (edited.name, edited.quantity) == ("Oat milk", None)

    ticked = dao.update_item(joiner_token, shopping_list.id, milk.id, {"bought": True})
    assert ticked.bought is True

    assert dao.delete_item(joiner_token, shopping_list.id, milk.id) is True
    assert dao.fetch_items(joiner_token, shopping_list.id) == []


def test_non_member_cannot_read_change_or_delete_items(make_user, list_with_item):
    owner_token, _, shopping_list, milk = list_with_item
    _, outsider_token = make_user("Outsider")
    dao = ItemDAO()

    assert dao.fetch_items(outsider_token, shopping_list.id) == []
    assert dao.fetch_item(outsider_token, shopping_list.id, milk.id) is None
    # Updates and deletes match no rows the outsider can see
    assert dao.update_item(outsider_token, shopping_list.id, milk.id, {"name": "Hacked"}) is None
    assert dao.delete_item(outsider_token, shopping_list.id, milk.id) is False

    assert dao.fetch_items(owner_token, shopping_list.id) == [milk]


def test_non_member_cannot_insert_an_item_directly(make_user, list_with_item):
    owner_token, _, shopping_list, milk = list_with_item
    _, outsider_token = make_user("Outsider")

    with pytest.raises(APIError) as error:
        get_user_client(outsider_token).table(Item.db_table()).insert(
            Item(name="Sneaky", list_id=shopping_list.id).to_row()
        ).execute()

    assert error.value.code == "42501"  # RLS refused the row
    assert ItemDAO().fetch_items(owner_token, shopping_list.id) == [milk]


def test_member_cannot_move_an_item_to_another_households_list(make_user, cleanup_households, list_with_item):
    owner_token, _, shopping_list, milk = list_with_item
    _, other_token = make_user("Other")
    other_household = HouseholdDAO().create_household(other_token, "Other House")
    cleanup_households.append(other_household.id)
    other_list = _new_list(other_token, other_household.id, "Their list")

    with pytest.raises(APIError) as error:
        ItemDAO().update_item(owner_token, shopping_list.id, milk.id, {"list_id": other_list.id})

    assert error.value.code == "42501"
    assert ItemDAO().fetch_items(other_token, other_list.id) == []
