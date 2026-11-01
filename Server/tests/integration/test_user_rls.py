"""
Row Level Security on USER (#51), against the live Supabase project: a user
can rename themselves but not anyone else, even going straight to the database.
Run with:  pytest -m integration
"""

import pytest

from users.UserDAO import UserDAO

pytestmark = pytest.mark.integration


def test_user_renames_themselves(make_user):
    user_id, token = make_user("Renamer")

    renamed = UserDAO().update_name(token, user_id, "New Name")

    assert renamed.name == "New Name"
    assert UserDAO().fetch_user(token, user_id).name == "New Name"


def test_user_cannot_rename_someone_else(make_user):
    victim_id, victim_token = make_user("Victim")
    _, other_token = make_user("Other")
    before = UserDAO().fetch_user(victim_token, victim_id).name

    assert UserDAO().update_name(other_token, victim_id, "Hijacked") is None
    assert UserDAO().fetch_user(victim_token, victim_id).name == before
