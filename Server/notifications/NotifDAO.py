"""
Notifications DAO (Data Access Object)
Database operations for notifications. Queries run as the signed-in user, so
Row Level Security limits them to that member's own notifications.
Notifications are created only by the item trigger (migration 011), never here;
members can change only the read flag (migration 015).
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from schema import Notification
from supabase_client import get_user_client

# The inbox shows only this many days; older notifications are deleted nightly (#30)
INBOX_DAYS = 30


def _inbox_cutoff() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=INBOX_DAYS)).isoformat()


class NotificationDAO:
    """Handle database operations for notifications"""

    def _table(self, token: str):
        return get_user_client(token).table(Notification.db_table())

    def fetch_inbox(self, token: str) -> List[Notification]:
        """The signed-in member's notifications from the last 30 days, newest first."""
        response = (
            self._table(token)
            .select("*")
            .gte(Notification.column("created_at"), _inbox_cutoff())
            .order(Notification.column("created_at"), desc=True)
            .order(Notification.column("id"), desc=True)
            .execute()
        )
        return [Notification.from_row(row) for row in response.data]

    def count_unread(self, token: str) -> int:
        """How many of the member's notifications from the last 30 days are unread."""
        # Not head=True: postgrest-py reads a HEAD response's empty body as count 0.
        # The exact count comes back in Content-Range however many rows are returned.
        response = (
            self._table(token)
            .select(Notification.column("id"), count="exact")
            .eq(Notification.column("read"), False)
            .gte(Notification.column("created_at"), _inbox_cutoff())
            .limit(1)
            .execute()
        )
        return response.count or 0

    def mark_read(self, token: str, notification_id: int) -> Optional[Notification]:
        """Mark one of the member's notifications read; None if they have no such notification."""
        response = (
            self._table(token)
            .update({Notification.column("read"): True})
            .eq(Notification.column("id"), notification_id)
            .execute()
        )
        return Notification.from_row(response.data[0]) if response.data else None

    def mark_all_read(self, token: str) -> int:
        """Mark every unread notification of the member's read; returns how many changed."""
        response = (
            self._table(token)
            .update({Notification.column("read"): True})
            .eq(Notification.column("read"), False)
            .execute()
        )
        return len(response.data)
