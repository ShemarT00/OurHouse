"""
Notifications Controllers
Business logic for notification operations
"""

from typing import Any, Dict, List, Optional

from .NotifDAO import NotificationDAO


class NotificationController:
    """Handle notification business logic and operations"""

    def __init__(self, dao: Optional[NotificationDAO] = None):
        self._dao = dao or NotificationDAO()

    def list_notifications(self, token: str) -> List[Dict[str, Any]]:
        """The signed-in member's inbox, newest first (RLS limits it to their own)."""
        return [notification.to_api() for notification in self._dao.fetch_inbox(token)]

    def unread_count(self, token: str) -> Dict[str, int]:
        return {"count": self._dao.count_unread(token)}

    def mark_read(self, token: str, notification_id: int) -> Optional[Dict[str, Any]]:
        """The notification, now read; None if it is not the member's."""
        notification = self._dao.mark_read(token, notification_id)
        return notification.to_api() if notification else None

    def mark_all_read(self, token: str) -> Dict[str, int]:
        return {"count": self._dao.mark_all_read(token)}
