"""
Row Level Security on HOUSEHOLD and MEMBER, against the live Supabase project.

Creates two throwaway, pre-confirmed users with the service key (no emails are
sent), runs the real HouseholdDAO as each of them, and deletes everything it
created afterwards (fixtures in conftest.py). Run with:  pytest -m integration
"""

import pytest

from households.HouseholdDAO import HouseholdDAO
from schema import Member
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


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
