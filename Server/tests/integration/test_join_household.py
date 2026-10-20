"""
Joining a household by invite code (#6), against the live Supabase project:
valid code, invalid code, repeat join, and who can see the members afterwards.
Run with:  pytest -m integration
"""

import pytest

from households.HouseholdDAO import HouseholdDAO
from members.MemberDAO import MemberDAO

pytestmark = pytest.mark.integration


@pytest.fixture()
def household(make_user, cleanup_households):
    """A household created by its owner; returns (owner_id, owner_token, household)."""
    owner_id, owner_token = make_user("Owner")
    household = HouseholdDAO().create_household(owner_token, "Join Test House")
    cleanup_households.append(household.id)
    return owner_id, owner_token, household


def test_valid_code_adds_the_user_as_a_member(make_user, household):
    owner_id, owner_token, created = household
    joiner_id, joiner_token = make_user("Joiner")

    # Codes are accepted in any case, with stray spaces
    joined = HouseholdDAO().join_household(joiner_token, f"  {created.invite_code.lower()} ")

    assert joined == created
    members = MemberDAO().fetch_members(joiner_token, created.id)
    assert [(m.user_id, m.is_admin, m.first_name) for m in members] == [
        (owner_id, True, "Owner"),
        (joiner_id, False, "Joiner"),
    ]
    # Both users see each other
    assert MemberDAO().fetch_members(owner_token, created.id) == members
    assert created.id in [h.id for h in HouseholdDAO().fetch_households(joiner_token)]


def test_invalid_code_joins_nothing(make_user, household):
    _, owner_token, created = household
    _, joiner_token = make_user("Guesser")

    assert HouseholdDAO().join_household(joiner_token, "ZZZZZZZZ") is None
    assert HouseholdDAO().fetch_households(joiner_token) == []
    assert len(MemberDAO().fetch_members(owner_token, created.id)) == 1


def test_joining_twice_does_not_duplicate_the_membership(make_user, household):
    _, owner_token, created = household
    _, joiner_token = make_user("Twice")

    first = HouseholdDAO().join_household(joiner_token, created.invite_code)
    second = HouseholdDAO().join_household(joiner_token, created.invite_code)

    assert first == second == created
    assert len(MemberDAO().fetch_members(owner_token, created.id)) == 2


def test_owner_joining_their_own_household_stays_admin(household):
    owner_id, owner_token, created = household

    HouseholdDAO().join_household(owner_token, created.invite_code)

    members = MemberDAO().fetch_members(owner_token, created.id)
    assert [(m.user_id, m.is_admin) for m in members] == [(owner_id, True)]


def test_non_members_cannot_list_members(make_user, household):
    _, _, created = household
    _, outsider_token = make_user("Outsider")

    assert MemberDAO().fetch_members(outsider_token, created.id) == []
