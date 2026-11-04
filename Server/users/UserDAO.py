"""
Users DAO (Data Access Object)
Database operations for users
"""

from typing import Any, Dict, List, Optional

from schema import ItemEvent, User
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

    def update_name(self, token: str, user_id: str, name: str) -> Optional[User]:
        """Rename a user as the signed-in user; None if no row."""
        return self._update_own(token, user_id, {User.column("name"): name})

    def set_switched_off_events(self, token: str, user_id: str, events: List[ItemEvent]) -> Optional[User]:
        """Replace the user's Switched-off Events as the signed-in user; None if no row."""
        return self._update_own(token, user_id, {User.column("switched_off_events"): [e.value for e in events]})

    def _update_own(self, token: str, user_id: str, changes: Dict[str, Any]) -> Optional[User]:
        """Update a user as the signed-in user, so RLS limits it to their own row; None if no row."""
        response = (
            get_user_client(token)
            .table(User.db_table())
            .update(changes)
            .eq(User.column("id"), user_id)
            .execute()
        )
        return User.from_row(response.data[0]) if response.data else None
