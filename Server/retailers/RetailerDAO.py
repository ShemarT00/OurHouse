"""
Retailers DAO (Data Access Object)
Database operations for retailers. Every signed-in user can read them; Row
Level Security refuses all writes (retailers change only through migrations).
"""

from typing import List, Optional

from schema import Retailer
from supabase_client import get_user_client


class RetailerDAO:
    """Handle database operations for retailers"""

    def _table(self, token: str):
        return get_user_client(token).table(Retailer.db_table())

    def fetch_retailers(self, token: str) -> List[Retailer]:
        """Retailers that are not retired, by name."""
        response = (
            self._table(token)
            .select("*")
            .eq(Retailer.column("retired"), False)
            .order(Retailer.column("name"))
            .execute()
        )
        return [Retailer.from_row(row) for row in response.data]

    def fetch_retailer(self, token: str, key: str) -> Optional[Retailer]:
        """One retailer, retired or not; None if there is no such key."""
        response = self._table(token).select("*").eq(Retailer.column("key"), key).limit(1).execute()
        return Retailer.from_row(response.data[0]) if response.data else None
