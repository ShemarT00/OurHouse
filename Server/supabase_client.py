"""
Supabase client singleton for the OurHouse server.
Import `supabase` from this module in DAOs and services.
"""

import os
from supabase import create_client, Client

_url: str = os.getenv("SUPABASE_URL", "")
_key: str = os.getenv("SUPABASE_KEY", "")

if not _url or not _key:
    raise EnvironmentError(
        "SUPABASE_URL and SUPABASE_KEY must be set in Server/.env"
    )

supabase: Client = create_client(_url, _key)
