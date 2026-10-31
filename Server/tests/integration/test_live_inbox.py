"""
Live inbox (#29), against the live Supabase project: each new notification is
broadcast on its recipient's private Realtime channel "inbox:<user id>". Only
that member can join it; another member listening on it receives nothing.
Run with:  pytest -m integration
"""

import asyncio

import pytest
from realtime import RealtimeSubscribeStates

from items.ItemDAO import ItemDAO
from schema import Item
from tests.integration.conftest import QUIET_PERIOD, Listener

pytestmark = pytest.mark.integration


def test_a_new_notification_reaches_only_its_recipient(supabase_env, shared_household):
    url, _, anon_key = supabase_env
    (alex_id, alex_token), (sam_id, sam_token), _, shopping_list = shared_household

    async def scenario():
        sam = Listener(url, anon_key, sam_token, f"inbox:{sam_id}")
        alex_own = Listener(url, anon_key, alex_token, f"inbox:{alex_id}")
        alex_snooping = Listener(url, anon_key, alex_token, f"inbox:{sam_id}")
        listeners = (sam, alex_own, alex_snooping)
        try:
            for listener in listeners:
                await listener.start()
            assert (sam.state, alex_own.state) == (RealtimeSubscribeStates.SUBSCRIBED,) * 2

            # Alex adds Milk: only Sam is notified
            await asyncio.to_thread(ItemDAO().create_item, alex_token, Item(name="Milk", list_id=shopping_list.id))

            await sam.wait_for(1)
            await asyncio.sleep(QUIET_PERIOD)
            return sam.events, alex_own.events, alex_snooping.state, alex_snooping.events
        finally:
            for listener in listeners:
                await listener.stop()

    sam_events, alex_own_events, snooping_state, snooping_events = asyncio.run(scenario())

    assert sam_events == ["INSERT"]
    assert alex_own_events == []  # the actor gets no notification, so no broadcast
    # Alex is refused Sam's channel ("Unauthorized") and hears nothing
    assert snooping_state == RealtimeSubscribeStates.CHANNEL_ERROR
    assert snooping_events == []
