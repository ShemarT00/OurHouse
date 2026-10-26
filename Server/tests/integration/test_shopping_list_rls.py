"""
Row Level Security on SHOPPINGLIST (#7), against the live Supabase project:
members create and see their household's lists; non-members see none and
cannot insert one, even when going straight to the database.
Run with:  pytest -m integration
"""

import pytest
from postgrest.exceptions import APIError

from households.HouseholdDAO import HouseholdDAO
from lists.ListDAO import ListDAO
from schema import ShoppingList
from supabase_client import get_user_client

pytestmark = pytest.mark.integration


@pytest.fixture()
def household_with_list(make_user, cleanup_households):
    """Owner creates a household and a list; returns (owner_token, household, shopping_list)."""
    _, owner_token = make_user("Owner")
    household = HouseholdDAO().create_household(owner_token, "List Test House")
    cleanup_households.append(household.id)  # deleting the household cascades to its lists
    shopping_list = ListDAO().create_list(owner_token, ShoppingList(name="Weekly shop", household_id=household.id))
    return owner_token, household, shopping_list


def test_member_creates_and_sees_lists(household_with_list):
    owner_token, household, created = household_with_list

    assert created.id and created.name == "Weekly shop" and created.household_id == household.id
    assert ListDAO().fetch_lists(owner_token, household.id) == [created]
    assert ListDAO().fetch_list(owner_token, household.id, created.id) == created


def test_members_who_join_see_existing_lists(make_user, household_with_list):
    _, household, created = household_with_list
    _, joiner_token = make_user("Joiner")

    HouseholdDAO().join_household(joiner_token, household.invite_code)

    assert ListDAO().fetch_lists(joiner_token, household.id) == [created]


def test_non_member_cannot_read_lists(make_user, household_with_list):
    _, household, created = household_with_list
    _, outsider_token = make_user("Outsider")

    assert ListDAO().fetch_lists(outsider_token, household.id) == []
    assert ListDAO().fetch_list(outsider_token, household.id, created.id) is None


def test_non_member_cannot_insert_a_list_directly(make_user, household_with_list):
    owner_token, household, _ = household_with_list
    _, outsider_token = make_user("Outsider")

    with pytest.raises(APIError) as error:
        get_user_client(outsider_token).table(ShoppingList.db_table()).insert(
            ShoppingList(name="Sneaky", household_id=household.id).to_row()
        ).execute()

    assert error.value.code == "42501"  # insufficient_privilege: RLS refused the row
    assert [l.name for l in ListDAO().fetch_lists(owner_token, household.id)] == ["Weekly shop"]
