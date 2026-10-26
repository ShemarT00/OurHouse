"""
Lists DAO (Data Access Object)
Database operations for shopping lists. Queries run as the signed-in user, so
Row Level Security limits them to lists in households they belong to.
"""

from typing import List, Optional

from schema import ShoppingList
from supabase_client import get_user_client


class ListDAO:
    """Handle database operations for shopping lists"""

    def fetch_lists(self, token: str, household_id: int) -> List[ShoppingList]:
        """A household's lists, oldest first."""
        response = (
            get_user_client(token)
            .table(ShoppingList.db_table())
            .select("*")
            .eq(ShoppingList.column("household_id"), household_id)
            .order(ShoppingList.column("created_at"))
            .execute()
        )
        return [ShoppingList.from_row(row) for row in response.data]

    def fetch_list(self, token: str, household_id: int, list_id: int) -> Optional[ShoppingList]:
        """One list in a household; None if it does not exist or the user cannot see it."""
        response = (
            get_user_client(token)
            .table(ShoppingList.db_table())
            .select("*")
            .eq(ShoppingList.column("household_id"), household_id)
            .eq(ShoppingList.column("id"), list_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            return None
        return ShoppingList.from_row(response.data[0])

    def create_list(self, token: str, shopping_list: ShoppingList) -> ShoppingList:
        """Insert a list; RLS only allows it in a household the user belongs to."""
        response = (
            get_user_client(token)
            .table(ShoppingList.db_table())
            .insert(shopping_list.to_row())
            .execute()
        )
        return ShoppingList.from_row(response.data[0])
