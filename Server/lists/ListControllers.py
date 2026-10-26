"""
Lists Controllers
Business logic for shopping list operations
"""

from typing import Any, Dict, List, Optional

from households.HouseholdDAO import HouseholdDAO
from schema import ShoppingList

from .ListDAO import ListDAO

MAX_NAME_LENGTH = 255


class ListController:
    """Handle shopping list business logic and operations"""

    def __init__(self, dao: Optional[ListDAO] = None, household_dao: Optional[HouseholdDAO] = None):
        self._dao = dao or ListDAO()
        self._household_dao = household_dao or HouseholdDAO()

    def _can_see_household(self, token: str, household_id: int) -> bool:
        # RLS hides households the user is not a member of
        return self._household_dao.fetch_household(token, household_id) is not None

    def list_lists(self, token: str, household_id: int) -> Optional[List[Dict[str, Any]]]:
        """A household's lists, or None if the household does not exist or the user is not a member."""
        if not self._can_see_household(token, household_id):
            return None
        return [shopping_list.to_api() for shopping_list in self._dao.fetch_lists(token, household_id)]

    def get_list(self, token: str, household_id: int, list_id: int) -> Optional[Dict[str, Any]]:
        """One list, or None if it does not exist or the user is not a member of its household."""
        shopping_list = self._dao.fetch_list(token, household_id, list_id)
        return None if shopping_list is None else shopping_list.to_api()

    def create_list(self, token: str, household_id: int, name: str) -> Optional[Dict[str, Any]]:
        """Create a named list in a household; None if the user is not a member.

        Raises ValueError for an invalid name.
        """
        name = (name or "").strip()
        if not name or len(name) > MAX_NAME_LENGTH:
            raise ValueError(f"List name must be 1-{MAX_NAME_LENGTH} characters")
        if not self._can_see_household(token, household_id):
            return None
        created = self._dao.create_list(token, ShoppingList(name=name, household_id=household_id))
        return created.to_api()
