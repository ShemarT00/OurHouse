"""
Users Controllers
Business logic for user operations
"""

from typing import Any, Dict, Optional

from .UserDAO import UserDAO

MAX_NAME_LENGTH = 255


def _name(value: Any) -> str:
    name = value.strip() if isinstance(value, str) else ""
    if not name or len(name) > MAX_NAME_LENGTH:
        raise ValueError(f"Name must be 1-{MAX_NAME_LENGTH} characters")
    return name


class UserController:
    """Handle user business logic and operations"""

    def __init__(self, dao: Optional[UserDAO] = None):
        self._dao = dao or UserDAO()

    def get_current_user(self, token: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Profile of the signed-in user, shaped for the client, or None if it does not exist."""
        user = self._dao.fetch_user(token, user_id)
        return None if user is None else user.to_api()

    def update_name(self, token: str, user_id: str, name: Any) -> Optional[Dict[str, Any]]:
        """Rename the signed-in user; their updated profile, or None if it does not exist.

        Raises ValueError if the name is not a string of 1-255 characters once trimmed.
        """
        user = self._dao.update_name(token, user_id, _name(name))
        return None if user is None else user.to_api()
