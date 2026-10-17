"""
Users Controllers
Business logic for user operations
"""

from typing import Any, Dict, Optional

from .UserDAO import UserDAO


class UserController:
    """Handle user business logic and operations"""

    def __init__(self, dao: Optional[UserDAO] = None):
        self._dao = dao or UserDAO()

    def get_current_user(self, token: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Profile of the signed-in user, shaped for the client, or None if it does not exist."""
        user = self._dao.fetch_user(token, user_id)
        if user is None:
            return None
        return {
            "OHID": user.id,
            "name": user.name,
            "email": user.email,
            "createdAt": user.created_at,
        }
