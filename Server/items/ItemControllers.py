"""
Items Controllers
Business logic for shopping list item operations
"""

from typing import Any, Dict, List, Optional

from lists.ListDAO import ListDAO
from schema import Item, Priority

from .ItemDAO import ItemDAO

MAX_NAME_LENGTH = 255
MAX_NOTES_LENGTH = 1000
MAX_QUANTITY = 9999

# Fields a client may set, by their JSON (camelCase) name
EDITABLE_FIELDS = {"name": "name", "priority": "priority", "quantity": "quantity", "notes": "notes", "bought": "bought"}


def _name(value: Any) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Item name is required")
    value = value.strip()
    if len(value) > MAX_NAME_LENGTH:
        raise ValueError(f"Item name must be {MAX_NAME_LENGTH} characters or fewer")
    return value


def _priority(value: Any) -> Priority:
    if isinstance(value, bool) or not isinstance(value, int) or value not in {p.value for p in Priority}:
        raise ValueError("Priority must be 0 (none), 1 (low), 2 (medium) or 3 (high)")
    return Priority(value)


def _quantity(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= MAX_QUANTITY:
        raise ValueError(f"Quantity must be a whole number from 1 to {MAX_QUANTITY}")
    return value


def _notes(value: Any) -> Optional[str]:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("Notes must be text")
    value = value.strip()
    if len(value) > MAX_NOTES_LENGTH:
        raise ValueError(f"Notes must be {MAX_NOTES_LENGTH} characters or fewer")
    return value or None


def _bought(value: Any) -> bool:
    if not isinstance(value, bool):
        raise ValueError("bought must be true or false")
    return value


VALIDATORS = {"name": _name, "priority": _priority, "quantity": _quantity, "notes": _notes, "bought": _bought}


class ItemController:
    """Handle shopping list item business logic and operations"""

    def __init__(self, dao: Optional[ItemDAO] = None, list_dao: Optional[ListDAO] = None):
        self._dao = dao or ItemDAO()
        self._list_dao = list_dao or ListDAO()

    def _list_visible(self, token: str, household_id: int, list_id: int) -> bool:
        # The list must belong to this household, and RLS hides it from non-members
        return self._list_dao.fetch_list(token, household_id, list_id) is not None

    def list_items(self, token: str, household_id: int, list_id: int) -> Optional[List[Dict[str, Any]]]:
        """A list's items, or None if the list is not in this household or the user is not a member."""
        if not self._list_visible(token, household_id, list_id):
            return None
        return [item.to_api() for item in self._dao.fetch_items(token, list_id)]

    def get_item(self, token: str, household_id: int, list_id: int, item_id: int) -> Optional[Dict[str, Any]]:
        if not self._list_visible(token, household_id, list_id):
            return None
        item = self._dao.fetch_item(token, list_id, item_id)
        return None if item is None else item.to_api()

    def create_item(self, token: str, household_id: int, list_id: int, body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add an item to a list. Raises ValueError for invalid fields; None if the list is not visible."""
        item = Item(
            name=_name(body.get("name")),
            list_id=list_id,
            priority=_priority(body.get("priority", Priority.NONE.value)),
            quantity=_quantity(body.get("quantity")),
            notes=_notes(body.get("notes")),
        )
        if not self._list_visible(token, household_id, list_id):
            return None
        return self._dao.create_item(token, item).to_api()

    def update_item(self, token: str, household_id: int, list_id: int, item_id: int,
                    body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Change any of name, priority, quantity, notes, bought. Raises ValueError for invalid fields."""
        changes = {
            field: VALIDATORS[field](body[json_name])
            for json_name, field in EDITABLE_FIELDS.items()
            if json_name in body
        }
        if not changes:
            raise ValueError("Nothing to update")
        changes = {k: v.value if isinstance(v, Priority) else v for k, v in changes.items()}
        if not self._list_visible(token, household_id, list_id):
            return None
        item = self._dao.update_item(token, list_id, item_id, changes)
        return None if item is None else item.to_api()

    def toggle_bought(self, token: str, household_id: int, list_id: int, item_id: int) -> Optional[Dict[str, Any]]:
        """Flip an item between needed and bought."""
        if not self._list_visible(token, household_id, list_id):
            return None
        item = self._dao.fetch_item(token, list_id, item_id)
        if item is None:
            return None
        updated = self._dao.update_item(token, list_id, item_id, {"bought": not item.bought})
        return None if updated is None else updated.to_api()

    def delete_item(self, token: str, household_id: int, list_id: int, item_id: int) -> bool:
        """Delete an item; False if it does not exist or the user is not a member."""
        if not self._list_visible(token, household_id, list_id):
            return False
        return self._dao.delete_item(token, list_id, item_id)
