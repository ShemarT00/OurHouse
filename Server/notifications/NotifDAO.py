"""
Notifications DAO (Data Access Object)
Database operations for notifications. Queries run as the signed-in user, so
Row Level Security limits them to that member's own notifications.
Notifications are created only by the item trigger (migration 011), never here.
"""

from datetime import datetime, timedelta, timezone
from typing import List

from schema import Notification
from supabase_client import get_user_client

# The inbox shows only this many days; older notifications are deleted nightly (#30)
INBOX_DAYS = 30


def _inbox_cutoff() -> str:
    return (datetime.now(timezone.utc) - timedelta(days=INBOX_DAYS)).isoformat()


class NotificationDAO:
    """Handle database operations for notifications"""

    def fetch_inbox(self, token: str) -> List[Notification]:
        """The signed-in member's notifications from the last 30 days, newest first."""
        response = (
            get_user_client(token)
            .table(Notification.db_table())
            .select("*")
            .gte(Notification.column("created_at"), _inbox_cutoff())
            .order(Notification.column("created_at"), desc=True)
            .order(Notification.column("id"), desc=True)
            .execute()
        )
        return [Notification.from_row(row) for row in response.data]
