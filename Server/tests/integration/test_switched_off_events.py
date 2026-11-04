"""
Switched-off Events (#63, ADR 0004), against the live Supabase project: an
account that switches off a kind of item event gets no notifications of that
kind, in any household it belongs to, until it switches it back on. Nothing
missed meanwhile is delivered later, and muting still works alongside.
Run with:  pytest -m integration
"""

import uuid

import pytest
from postgrest.exceptions import APIError

from households.HouseholdDAO import HouseholdDAO
from items.ItemDAO import ItemDAO
from members.MemberDAO import MemberDAO
from schema import Item, ItemEvent, User
from supabase_client import get_user_client
from users.UserDAO import UserDAO

from .item_events import EVERY_ITEM_EVENT, do_every_item_event, inbox_events

pytestmark = pytest.mark.integration

# The events behind each switch in Settings; Bought and Un-bought share one
SWITCHES = {
    "added": [ItemEvent.ADDED],
    "edited": [ItemEvent.EDITED],
    "bought or un-bought": [ItemEvent.BOUGHT, ItemEvent.UNBOUGHT],
    "removed": [ItemEvent.REMOVED],
}


@pytest.mark.parametrize("switched_off", SWITCHES.values(), ids=SWITCHES.keys())
def test_a_switched_off_event_stops_only_that_kind_of_notification_in_every_household(
    shared_household, second_household, switched_off
):
    (_, alex_token), (sam_id, sam_token), _, home_list = shared_household
    _, flat_list = second_household

    saved = UserDAO().set_switched_off_events(sam_token, sam_id, switched_off)
    do_every_item_event(alex_token, home_list.id)
    do_every_item_event(alex_token, flat_list.id)

    assert saved.switched_off_events == switched_off
    still_on = [event for event in EVERY_ITEM_EVENT if event not in switched_off]
    assert [event for event, _ in inbox_events(sam_token)] == still_on + still_on


def test_switched_off_events_belong_to_the_account_that_chose_them(make_user, shared_household):
    (_, alex_token), (sam_id, sam_token), household, shopping_list = shared_household
    kim_id, kim_token = make_user("Kim")
    HouseholdDAO().join_household(kim_token, household.invite_code)

    UserDAO().set_switched_off_events(sam_token, sam_id, EVERY_ITEM_EVENT)
    do_every_item_event(alex_token, shopping_list.id)

    assert inbox_events(sam_token) == []
    assert [event for event, _ in inbox_events(kim_token)] == EVERY_ITEM_EVENT
    assert UserDAO().fetch_user(kim_token, kim_id).switched_off_events == []


def test_switching_an_event_back_on_delivers_only_new_events(shared_household):
    (_, alex_token), (sam_id, sam_token), _, shopping_list = shared_household
    users = UserDAO()

    users.set_switched_off_events(sam_token, sam_id, [ItemEvent.ADDED])
    ItemDAO().create_item(alex_token, Item(name="Milk", list_id=shopping_list.id))
    assert users.set_switched_off_events(sam_token, sam_id, []).switched_off_events == []
    ItemDAO().create_item(alex_token, Item(name="Eggs", list_id=shopping_list.id))

    assert inbox_events(sam_token) == [(ItemEvent.ADDED, "Alex added Eggs")]


def test_new_accounts_start_with_nothing_switched_off(admin):
    # A brand-new account rather than a pooled one, which make_user resets
    user = admin.auth.admin.create_user({
        "email": f"rls-{uuid.uuid4().hex[:12]}@ourhouse.test",
        "password": uuid.uuid4().hex,
        "email_confirm": True,
        "user_metadata": {"first_name": "New", "last_name": "Test"},
    }).user
    try:
        row = (
            admin.table(User.db_table()).select("*").eq(User.column("id"), user.id).execute().data[0]
        )
        assert User.from_row(row).switched_off_events == []
    finally:
        admin.auth.admin.delete_user(user.id)


def test_muting_still_works_alongside_switched_off_events(shared_household, second_household):
    (_, alex_token), (sam_id, sam_token), home, home_list = shared_household
    _, flat_list = second_household

    UserDAO().set_switched_off_events(sam_token, sam_id, [ItemEvent.EDITED])
    MemberDAO().set_muted(sam_token, home.id, True)
    do_every_item_event(alex_token, home_list.id, name="Milk")
    do_every_item_event(alex_token, flat_list.id, name="Eggs")

    # Nothing from the muted household; everything but Edited from the other
    assert inbox_events(sam_token) == [
        (ItemEvent.ADDED, "Alex added Eggs"),
        (ItemEvent.BOUGHT, "Alex bought Eggs"),
        (ItemEvent.UNBOUGHT, "Alex un-ticked Eggs"),
        (ItemEvent.REMOVED, "Alex removed Eggs"),
    ]


def test_only_item_event_names_can_be_switched_off(make_user):
    user_id, token = make_user("Sam")

    with pytest.raises(APIError):
        (
            get_user_client(token)
            .table(User.db_table())
            .update({User.column("switched_off_events"): ["added", "sold"]})
            .eq(User.column("id"), user_id)
            .execute()
        )
    assert UserDAO().fetch_user(token, user_id).switched_off_events == []


def test_an_account_cannot_change_another_accounts_switched_off_events(shared_household):
    (alex_id, alex_token), (_, sam_token), _, _ = shared_household

    response = (
        get_user_client(sam_token)
        .table(User.db_table())
        .update({User.column("switched_off_events"): ["added"]})
        .eq(User.column("id"), alex_id)
        .execute()
    )

    assert response.data == []
    assert UserDAO().fetch_user(alex_token, alex_id).switched_off_events == []
