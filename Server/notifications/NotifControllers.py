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
