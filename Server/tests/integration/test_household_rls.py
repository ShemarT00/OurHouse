"""
Row Level Security on HOUSEHOLD and MEMBER, against the live Supabase project.

Creates two throwaway, pre-confirmed users with the service key (no emails are
sent), runs the real HouseholdDAO as each of them, and deletes everything it
created afterwards. Run with:  pytest -m integration
"""

import os
import uuid

import pytest

import app  # noqa: F401  (loads Server/.env and the OS trust store for TLS)
from households.HouseholdDAO import HouseholdDAO
from schema import Household, Member
from supabase_client import get_user_client

pytestmark = pytest.mark.integration

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


def _member_rows(token, household_id):
    return (
        get_user_client(token)
        .table(Member.db_table())
        .select("*")
        .eq(Member.column("household_id"), household_id)
        .execute()
        .data
    )


def test_only_members_can_read_a_household(make_user, cleanup_households):
    owner_id, owner_token = make_user("Owner")
    _, outsider_token = make_user("Outsider")
    dao = HouseholdDAO()

    household = dao.create_household(owner_token, "RLS Test House")
    cleanup_households.append(household.id)

    # The creator gets a shareable invite code and an admin membership
    assert household.invite_code and len(household.invite_code) == 8
    assert household.created_by == owner_id
    owner_members = [Member.from_row(row) for row in _member_rows(owner_token, household.id)]
    assert [(m.user_id, m.is_admin, m.first_name) for m in owner_members] == [(owner_id, True, "Owner")]

    # The creator can read it
    assert dao.fetch_household(owner_token, household.id) == household
    assert household.id in [h.id for h in dao.fetch_households(owner_token)]

    # A signed-in non-member sees nothing: not the household, not its members
    assert dao.fetch_household(outsider_token, household.id) is None
    assert household.id not in [h.id for h in dao.fetch_households(outsider_token)]
    assert _member_rows(outsider_token, household.id) == []


def test_invite_codes_are_unique(make_user, cleanup_households):
    _, token = make_user("Coder")
    dao = HouseholdDAO()

    codes = []
    for i in range(3):
        household = dao.create_household(token, f"Code Test {i}")
        cleanup_households.append(household.id)
        codes.append(household.invite_code)

    assert len(set(codes)) == 3
