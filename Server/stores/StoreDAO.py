"""
Stores DAO (Data Access Object)
Database operations for stores. Queries run as the signed-in user, so Row
Level Security limits them to stores in households they belong to.
"""

from typing import List, Optional

from postgrest.exceptions import APIError

from schema import Store
from supabase_client import get_user_client

UNIQUE_VIOLATION = "23505"


class DuplicateStoreError(ValueError):
    """The household already has a store with this name."""


class StoreDAO:
    """Handle database operations for stores"""

    def _table(self, token: str):
        return get_user_client(token).table(Store.db_table())

    def fetch_stores(self, token: str, household_id: int) -> List[Store]:
        """A household's stores, by name."""
        response = (
            self._table(token)
            .select("*")
            .eq(Store.column("household_id"), household_id)
            .order(Store.column("name"))
            .execute()
        )
        return [Store.from_row(row) for row in response.data]

    def fetch_store(self, token: str, household_id: int, store_id: int) -> Optional[Store]:
        """One store in a household; None if it does not exist or the user cannot see it."""
        response = (
            self._table(token)
            .select("*")
            .eq(Store.column("household_id"), household_id)
            .eq(Store.column("id"), store_id)
            .limit(1)
            .execute()
        )
        return Store.from_row(response.data[0]) if response.data else None

    def create_store(self, token: str, store: Store) -> Store:
        """Insert a store; RLS only allows it in a household the user belongs to.

        Raises DuplicateStoreError if the household already has a store with that name.
        """
        try:
            response = self._table(token).insert(store.to_row()).execute()
        except APIError as e:
            if e.code == UNIQUE_VIOLATION:
                raise DuplicateStoreError(f'There is already a store called "{store.name}"') from e
            raise
        return Store.from_row(response.data[0])
