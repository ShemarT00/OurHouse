"""
Households DAO (Data Access Object)
Database operations for households. Every query runs as the signed-in user,
so Row Level Security limits results to households they are a member of.
"""

from typing import List, Optional

from schema import Household
from supabase_client import get_user_client


class HouseholdDAO:
    """Handle database operations for households"""

    def create_household(self, token: str, name: str) -> Household:
        """Create a household and the caller's admin membership (create_household RPC, migration 005)."""
        response = get_user_client(token).rpc("create_household", {"p_name": name}).execute()
        row = response.data[0] if isinstance(response.data, list) else response.data
        return Household.from_row(row)

    def fetch_households(self, token: str) -> List[Household]:
        """Query all households the user belongs to (RLS filters out the rest)."""
        response = (
            get_user_client(token)
            .table(Household.db_table())
            .select("*")
            .order(Household.column("created_at"))
            .execute()
        )
        return [Household.from_row(row) for row in response.data]

    def fetch_household(self, token: str, household_id: int) -> Optional[Household]:
        """Query one household; None if it does not exist or the user is not a member."""
        response = (
            get_user_client(token)
            .table(Household.db_table())
            .select("*")
            .eq(Household.column("id"), household_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return Household.from_row(response.data[0])
