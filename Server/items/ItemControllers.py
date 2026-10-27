"""
Items Controllers
Business logic for shopping list item operations
"""

from typing import Any, Dict, List, Optional

from lists.ListDAO import ListDAO
from schema import Item, Priority
from stores.StoreDAO import StoreDAO

from .ItemDAO import ItemDAO

MAX_NAME_LENGTH = 255
MAX_NOTES_LENGTH = 1000
MAX_QUANTITY = 9999

# Fields a client may set, by their JSON (camelCase) name
EDITABLE_FIELDS = {
    "name": "name", "priority": "priority", "quantity": "quantity", "notes": "notes",
    "bought": "bought", "storeId": "store_id",
}


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


def _store_id(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ValueError("storeId must be a store's OHID or null")
    return value


VALIDATORS = {
    "name": _name, "priority": _priority, "quantity": _quantity, "notes": _notes,
    "bought": _bought, "store_id": _store_id,
}


class ItemController:
    """Handle shopping list item business logic and operations"""

    def __init__(self, dao: Optional[ItemDAO] = None, list_dao: Optional[ListDAO] = None,
                 store_dao: Optional[StoreDAO] = None):
        self._dao = dao or ItemDAO()
        self._list_dao = list_dao or ListDAO()
        self._store_dao = store_dao or StoreDAO()

    def _list_visible(self, token: str, household_id: int, list_id: int) -> bool:
        # The list must belong to this household, and RLS hides it from non-members
        return self._list_dao.fetch_list(token, household_id, list_id) is not None

    def _check_store(self, token: str, household_id: int, store_id: Optional[int]) -> None:
        # An item's store must be one of its household's stores
        if store_id is not None and self._store_dao.fetch_store(token, household_id, store_id) is None:
            raise ValueError("Store not found in this household")

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
            store_id=_store_id(body.get("storeId")),
        )
        if not self._list_visible(token, household_id, list_id):
            return None
        self._check_store(token, household_id, item.store_id)
        return self._dao.create_item(token, item).to_api()

    def update_item(self, token: str, household_id: int, list_id: int, item_id: int,
                    body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Change any of name, priority, quantity, notes, bought, storeId. Raises ValueError for invalid fields."""
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
        self._check_store(token, household_id, changes.get("store_id"))
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
