"""
Member DAO (Data Access Object)
Database operations for members. Queries run as the signed-in user, so Row
Level Security only returns members of households they belong to.
"""

from typing import List, Optional

from schema import Member
from supabase_client import get_user_client


class MemberDAO:
    """Handle database operations for members"""

    def fetch_members(self, token: str, household_id: int) -> List[Member]:
        """Members of a household, oldest first; empty if the user is not a member."""
        response = (
            get_user_client(token)
            .table(Member.db_table())
            .select("*")
            .eq(Member.column("household_id"), household_id)
            .order(Member.column("created_at"))
            .execute()
        )
        return [Member.from_row(row) for row in response.data]

    def set_muted(self, token: str, household_id: int, muted: bool) -> Optional[bool]:
        """Mute or unmute the caller's own membership (set_household_muted RPC, migration 019).

        Returns the new flag, or None if the caller is not a member of the household.
        """
        response = (
            get_user_client(token)
            .rpc("set_household_muted", {"p_household_id": household_id, "p_muted": muted})
            .execute()
        )
        return response.data
