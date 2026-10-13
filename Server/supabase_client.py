"""
Supabase clients for the OurHouse server.

Clients are created lazily so the app (and its tests) can be imported without
Supabase credentials. DAOs should use `get_user_client(token)` so Row Level
Security applies to the signed-in user; `get_admin_client()` is reserved for
operations that must bypass RLS (e.g. verifying a token).
"""

import os
from functools import lru_cache

from supabase import Client, create_client


def _credentials() -> tuple:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_KEY", "")
    if not url or not key:
        raise EnvironmentError("SUPABASE_URL and SUPABASE_KEY must be set in Server/.env")
    return url, key


@lru_cache(maxsize=1)
def get_admin_client() -> Client:
    """Return the shared server-side client."""
    return create_client(*_credentials())


def get_user_client(token: str) -> Client:
    """Return a client that sends the user's access token, so RLS policies apply."""
    client = create_client(*_credentials())
    client.postgrest.auth(token)
    return client
