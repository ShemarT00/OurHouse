"""
Fixtures for integration tests against the live Supabase project in Server/.env.
Users are created pre-confirmed with the service key (no emails are sent) and
deleted, with everything they own, after the test module.
"""

import os
import uuid

import pytest

import app  # noqa: F401  (loads Server/.env and the OS trust store for TLS)
from schema import Household, ShoppingList

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_ANON_KEY")


@pytest.fixture(scope="module")
def supabase_env():
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        pytest.skip(f"Set {', '.join(missing)} in Server/.env to run integration tests")
    return os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"], os.environ["SUPABASE_ANON_KEY"]


@pytest.fixture(scope="module")
def admin(supabase_env):
    from supabase import create_client

    url, service_key, _ = supabase_env
    return create_client(url, service_key)


@pytest.fixture(scope="module")
def make_user(supabase_env, admin):
    """Create confirmed users and return their access tokens; delete them at the end."""
    from supabase import create_client

    url, _, anon_key = supabase_env
    created_ids = []

    def _make(first_name):
        email = f"rls-{uuid.uuid4().hex[:12]}@ourhouse.test"
        password = uuid.uuid4().hex
        user = admin.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {"first_name": first_name, "last_name": "Test"},
        }).user
        created_ids.append(user.id)
        session = create_client(url, anon_key).auth.sign_in_with_password(
            {"email": email, "password": password}
        ).session
        return user.id, session.access_token

    yield _make

    # Deleting the auth user cascades to "USER" and MEMBER
    for user_id in created_ids:
        admin.auth.admin.delete_user(user_id)


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
