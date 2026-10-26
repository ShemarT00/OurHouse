"""
Member DAO (Data Access Object)
Database operations for members. Queries run as the signed-in user, so Row
Level Security only returns members of households they belong to.
"""

from typing import List

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
