"""
Users Controllers
Business logic for user operations
"""

from typing import Any, Dict, List, Optional

from schema import ItemEvent

from .UserDAO import UserDAO

MAX_NAME_LENGTH = 255


def _name(value: Any) -> str:
    name = value.strip() if isinstance(value, str) else ""
    if not name or len(name) > MAX_NAME_LENGTH:
        raise ValueError(f"Name must be 1-{MAX_NAME_LENGTH} characters")
    return name


def _item_events(value: Any) -> List[ItemEvent]:
    """Item event names as ItemEvents, each once, in the usual order.

    Raises ValueError unless value is a list of item event names.
    """
    names = [e.value for e in ItemEvent]
    if not isinstance(value, list) or not all(isinstance(v, str) and v in names for v in value):
        raise ValueError("Switched-off events must be a list of: " + ", ".join(names))
    return [e for e in ItemEvent if e.value in value]


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

    def set_switched_off_events(self, token: str, user_id: str, events: Any) -> Optional[Dict[str, Any]]:
        """Replace the signed-in user's Switched-off Events; their updated profile, or None if it does not exist.

        Raises ValueError unless events is a list of item event names.
        """
        user = self._dao.set_switched_off_events(token, user_id, _item_events(events))
        return None if user is None else user.to_api()
