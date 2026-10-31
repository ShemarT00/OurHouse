"""
get_user_client reuses one client per access token, and never shares a
client between two tokens. Supabase is not contacted: create_client is mocked.
"""

from unittest.mock import MagicMock

import pytest

import supabase_client


@pytest.fixture()
def create_client(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_KEY", "service-key")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon-key")
    create = MagicMock(side_effect=lambda url, key: MagicMock(name=f"client-{create.call_count}"))
    monkeypatch.setattr(supabase_client, "create_client", create)
    supabase_client.get_user_client.cache_clear()
    yield create
    supabase_client.get_user_client.cache_clear()


def test_the_same_token_reuses_one_client(create_client):
    first = supabase_client.get_user_client("token-a")

    assert supabase_client.get_user_client("token-a") is first
    create_client.assert_called_once_with("https://example.supabase.co", "anon-key")
    first.postgrest.auth.assert_called_once_with("token-a")


def test_each_token_gets_its_own_client(create_client):
    a = supabase_client.get_user_client("token-a")
    b = supabase_client.get_user_client("token-b")

    assert a is not b
    a.postgrest.auth.assert_called_once_with("token-a")
    b.postgrest.auth.assert_called_once_with("token-b")


def test_the_cache_is_bounded():
    assert supabase_client.get_user_client.cache_info().maxsize == supabase_client.USER_CLIENT_CACHE_SIZE
