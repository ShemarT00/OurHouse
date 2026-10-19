"""
Users DAO (Data Access Object)
Database operations for users
"""

from typing import Optional

from schema import User
from supabase_client import get_user_client


class UserDAO:
    """Handle database operations for users"""

    def fetch_user(self, token: str, user_id: str) -> Optional[User]:
        """Query a user as the signed-in user, so Row Level Security applies."""
        response = (
            get_user_client(token)
            .table(User.db_table())
            .select("*")
            .eq(User.column("id"), user_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return User.from_row(response.data[0])
