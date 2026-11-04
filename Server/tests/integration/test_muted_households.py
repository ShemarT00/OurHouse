"""
Muted households (#62, ADR 0004), against the live Supabase project: a member
who mutes a household gets no notifications from it until they unmute it.
Other members, and the member's other households, are unaffected, and
nothing missed while muted is delivered later. The actor is never notified.
Run with:  pytest -m integration
"""

import pytest

from households.HouseholdDAO import HouseholdDAO
from items.ItemDAO import ItemDAO
from lists.ListDAO import ListDAO
from members.MemberDAO import MemberDAO
from notifications.NotifDAO import NotificationDAO
from schema import Item, ItemEvent, Member, ShoppingList
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


def _events(token):
    """The member's notifications, oldest first, as (event, sentence)."""
    return [(n.event, n.sentence) for n in reversed(NotificationDAO().fetch_inbox(token))]


def _every_item_event(token, list_id):
    """Add, edit, tick, untick and remove Milk: one of each of the five item events."""
    dao = ItemDAO()
    milk = dao.create_item(token, Item(name="Milk", list_id=list_id))
    dao.update_item(token, list_id, milk.id, {"quantity": 2})
    dao.update_item(token, list_id, milk.id, {"bought": True})
    dao.update_item(token, list_id, milk.id, {"bought": False})
    dao.delete_item(token, list_id, milk.id)


def _muted(token, user_id):
    """Whether the user has muted each of their households, by household id."""
    return {household.id: muted for household, muted in HouseholdDAO().fetch_households(token, user_id)}


@pytest.fixture()
def kim(make_user, shared_household):
    """Kim, a third member of the shared household, who never mutes it."""
    *_, household, _ = shared_household
    kim_id, kim_token = make_user("Kim")
    HouseholdDAO().join_household(kim_token, household.invite_code)
    return kim_id, kim_token


def test_a_muted_member_gets_no_notification_for_any_item_event(shared_household, kim):
    (_, alex_token), (_, sam_token), household, shopping_list = shared_household
    _, kim_token = kim

    assert MemberDAO().set_muted(sam_token, household.id, True) is True
    _every_item_event(alex_token, shopping_list.id)

    assert _events(sam_token) == []
    assert [event for event, _ in _events(kim_token)] == [
        ItemEvent.ADDED, ItemEvent.EDITED, ItemEvent.BOUGHT, ItemEvent.UNBOUGHT, ItemEvent.REMOVED,
    ]
    assert _events(alex_token) == []  # the actor, as always


def test_a_muted_member_still_notifies_others_and_is_never_notified_of_their_own_changes(shared_household):
    (_, alex_token), (_, sam_token), household, shopping_list = shared_household
    MemberDAO().set_muted(sam_token, household.id, True)

    ItemDAO().create_item(sam_token, Item(name="Bread", list_id=shopping_list.id))

    assert _events(alex_token) == [(ItemEvent.ADDED, "Sam added Bread")]
    assert _events(sam_token) == []


def test_muting_one_household_leaves_the_members_other_households_unaffected(
    shared_household, cleanup_households
):
    (alex_id, alex_token), (sam_id, sam_token), home, home_list = shared_household
    flat = HouseholdDAO().create_household(alex_token, "Mute Test Flat")
    cleanup_households.append(flat.id)
    flat_list = ListDAO().create_list(alex_token, ShoppingList(name="Flat shop", household_id=flat.id))
    HouseholdDAO().join_household(sam_token, flat.invite_code)

    MemberDAO().set_muted(sam_token, home.id, True)
    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=home_list.id))
    ItemDAO().create_item(alex_token, Item(name="Eggs", list_id=flat_list.id))

    assert _events(sam_token) == [(ItemEvent.ADDED, "Alex added Eggs")]
    assert _muted(sam_token, sam_id) == {home.id: True, flat.id: False}
    assert _muted(alex_token, alex_id) == {home.id: False, flat.id: False}


def test_unmuting_delivers_nothing_missed_and_new_events_arrive_again(shared_household):
    (_, alex_token), (_, sam_token), household, shopping_list = shared_household
    members = MemberDAO()

    members.set_muted(sam_token, household.id, True)
    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))
    assert members.set_muted(sam_token, household.id, False) is False
    ItemDAO().create_item(alex_token, Item(name="Eggs", list_id=shopping_list.id))

    assert _events(sam_token) == [(ItemEvent.ADDED, "Alex added Eggs")]


def test_new_memberships_start_unmuted(shared_household):
    (alex_id, alex_token), (sam_id, sam_token), household, _ = shared_household

    # Alex created the household, Sam joined it
    assert _muted(alex_token, alex_id) == {household.id: False}
    assert _muted(sam_token, sam_id) == {household.id: False}


def test_muting_a_household_you_are_not_in_changes_nothing(make_user, shared_household):
    (alex_id, alex_token), _, household, _ = shared_household
    _, outsider_token = make_user("Outsider")

    assert MemberDAO().set_muted(outsider_token, household.id, True) is None
    assert _muted(alex_token, alex_id) == {household.id: False}


def test_a_member_cannot_change_another_members_muted_flag(shared_household):
    (alex_id, alex_token), (sam_id, sam_token), household, _ = shared_household

    # Muting only ever touches the caller's own membership
    MemberDAO().set_muted(sam_token, household.id, True)
    assert _muted(alex_token, alex_id) == {household.id: False}

    # Writing another member's row directly is refused by Row Level Security
    response = (
        get_user_client(sam_token)
        .table(Member.db_table())
        .update({Member.column("muted"): True})
        .eq(Member.column("household_id"), household.id)
        .eq(Member.column("user_id"), alex_id)
        .execute()
    )
    assert response.data == []
    assert _muted(alex_token, alex_id) == {household.id: False}
