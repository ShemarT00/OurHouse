"""
Live item updates (#10), against the live Supabase project: when one member
adds, edits or deletes an item, another member listening on the list's
private Realtime channel receives each change; a non-member listening on the
same channel receives nothing.
Run with:  pytest -m integration
"""

import asyncio

import pytest
from realtime import RealtimeSubscribeStates

from households.HouseholdDAO import HouseholdDAO
from items.ItemDAO import ItemDAO
from lists.ListDAO import ListDAO
from schema import Item, ShoppingList
from tests.integration.conftest import QUIET_PERIOD, Listener

pytestmark = pytest.mark.integration

@pytest.fixture()
def shared_list(make_user, cleanup_households):
    """Owner's household and list, with a second member; returns (owner, member, list)."""
    _, owner_token = make_user("Owner")
    household = HouseholdDAO().create_household(owner_token, "Live Test House")
    cleanup_households.append(household.id)  # cascades to lists and items
    shopping_list = ListDAO().create_list(owner_token, ShoppingList(name="Weekly shop", household_id=household.id))
    _, member_token = make_user("Member")
    HouseholdDAO().join_household(member_token, household.invite_code)
    return owner_token, member_token, shopping_list


async def _add_edit_delete(token, list_id):
    """Run the (blocking) item changes off the event loop so events keep arriving."""
    dao = ItemDAO()
    milk = await asyncio.to_thread(dao.create_item, token, Item(name="Milk", list_id=list_id))
    await asyncio.to_thread(dao.update_item, token, list_id, milk.id, {"bought": True})
    await asyncio.to_thread(dao.delete_item, token, list_id, milk.id)


def test_member_sees_changes_and_non_member_receives_none(supabase_env, make_user, shared_list):
    url, _, anon_key = supabase_env
    owner_token, member_token, shopping_list = shared_list
    _, outsider_token = make_user("Outsider")

    async def scenario():
        owner = Listener(url, anon_key, owner_token, f"list:{shopping_list.id}")
        outsider = Listener(url, anon_key, outsider_token, f"list:{shopping_list.id}")
        try:
            await owner.start()
            await outsider.start()
            assert owner.state == RealtimeSubscribeStates.SUBSCRIBED

            await _add_edit_delete(member_token, shopping_list.id)

            await owner.wait_for(3)
            await asyncio.sleep(QUIET_PERIOD)
            return owner.events, outsider.state, outsider.events
        finally:
            await owner.stop()
            await outsider.stop()

    owner_events, outsider_state, outsider_events = asyncio.run(scenario())

    assert owner_events == ["INSERT", "UPDATE", "DELETE"]
    # The outsider is refused the channel ("Unauthorized") and hears nothing
    assert outsider_state == RealtimeSubscribeStates.CHANNEL_ERROR
    assert outsider_events == []
