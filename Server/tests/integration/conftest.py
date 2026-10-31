"""
Fixtures for integration tests against the live Supabase project in Server/.env.
Users are created pre-confirmed with the service key (no emails are sent).
Supabase Auth limits how often users can sign in, so each test session (or
pytest-xdist worker) signs in a small pool of users once and reuses them:
make_user renames the next pooled user for each test, and cleanup_households
deletes each test's households, which removes everything a user had in them.
The pool is deleted at the end of the session.

Run in parallel with:  pytest -m integration -n 4
"""

import asyncio
import os
import uuid

import pytest
from realtime import AsyncRealtimeClient

import app  # noqa: F401  (loads Server/.env and the OS trust store for TLS)
from schema import Household, ShoppingList

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_ANON_KEY")


@pytest.fixture(scope="session")
def supabase_env():
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        pytest.skip(f"Set {', '.join(missing)} in Server/.env to run integration tests")
    return os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"], os.environ["SUPABASE_ANON_KEY"]


@pytest.fixture(scope="session")
def admin(supabase_env):
    from supabase import create_client

    url, service_key, _ = supabase_env
    return create_client(url, service_key)


@pytest.fixture(scope="session")
def user_pool(supabase_env, admin):
    """Signed-in users shared by every test in this session, as (user id, access token)."""
    from supabase import create_client

    url, _, anon_key = supabase_env
    pool = []

    def _sign_up():
        email = f"rls-{uuid.uuid4().hex[:12]}@ourhouse.test"
        password = uuid.uuid4().hex
        user = admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"first_name": "Pooled", "last_name": "Test"},
        }).user
        pool.append((user.id, None))  # recorded first, so it is deleted even if sign-in fails
        session = create_client(url, anon_key).auth.sign_in_with_password(
            {"email": email, "password": password}
        ).session
        pool[-1] = (user.id, session.access_token)

    yield pool, _sign_up

    # Deleting the auth user cascades to "USER" and MEMBER
    for user_id, _ in pool:
        admin.auth.admin.delete_user(user_id)


@pytest.fixture()
def make_user(admin, user_pool):
    """Return a different signed-in user on each call, as (user id, access token), named first_name.

    The name is set before the user creates or joins a household, which is when
    their member name is copied from it.
    """
    pool, sign_up = user_pool
    used = 0

    def _make(first_name):
        nonlocal used
        if used == len(pool):
            sign_up()
        user_id, token = pool[used]
        used += 1
        admin.auth.admin.update_user_by_id(
            user_id, {"user_metadata": {"first_name": first_name, "last_name": "Test"}})
        return user_id, token

    return _make


@pytest.fixture()
def cleanup_households(admin):
    household_ids = []
    yield household_ids
    for household_id in household_ids:
        admin.table(Household.db_table()).delete().eq(Household.column("id"), household_id).execute()


@pytest.fixture()
def shared_household(make_user, cleanup_households):
    """Alex's household with Sam as a second member, and one list; returns (alex, sam, household, list).

    alex and sam are (user id, access token) pairs.
    """
    from households.HouseholdDAO import HouseholdDAO
    from lists.ListDAO import ListDAO

    alex_id, alex_token = make_user("Alex")
    household = HouseholdDAO().create_household(alex_token, "Notify Test House")
    cleanup_households.append(household.id)  # cascades to lists, items and notifications
    shopping_list = ListDAO().create_list(alex_token, ShoppingList(name="Weekly shop", household_id=household.id))
    sam_id, sam_token = make_user("Sam")
    HouseholdDAO().join_household(sam_token, household.invite_code)
    return (alex_id, alex_token), (sam_id, sam_token), household, shopping_list


JOIN_TIMEOUT = 15  # seconds to wait for a channel join to be answered
EVENT_TIMEOUT = 15  # seconds to wait for the expected change events
QUIET_PERIOD = 5  # seconds an outsider is watched for stray events


class Listener:
    """One user's connection to a private Realtime channel (e.g. "list:3"), recording events received."""

    def __init__(self, url, anon_key, token, topic):
        self._client = AsyncRealtimeClient(f"{url}/realtime/v1", anon_key, auto_reconnect=False)
        self._token = token
        self._topic = topic
        self.events = []
        self.state = None
        self._answered = asyncio.Event()

    def _on_state(self, state, _error):
        self.state = state
        self._answered.set()

    async def start(self):
        await self._client.connect()
        await self._client.set_auth(self._token)
        channel = self._client.channel(self._topic, {"config": {"private": True}})
        # The Python client has no "*" wildcard (the app's JS client does), so name each event
        for event in ("INSERT", "UPDATE", "DELETE"):
            channel.on_broadcast(event, lambda message: self.events.append(message["event"]))
        await channel.subscribe(self._on_state)
        await asyncio.wait_for(self._answered.wait(), JOIN_TIMEOUT)

    async def wait_for(self, count):
        loop = asyncio.get_running_loop()
        deadline = loop.time() + EVENT_TIMEOUT
        while len(self.events) < count and loop.time() < deadline:
            await asyncio.sleep(0.2)

    async def stop(self):
        await self._client.close()
