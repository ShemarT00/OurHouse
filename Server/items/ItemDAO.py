"""
Items DAO (Data Access Object)
Database operations for shopping list items. Queries run as the signed-in
user, so Row Level Security limits them to items on lists in households they
belong to.
"""

from typing import Any, Dict, List, Optional

from schema import Item
from supabase_client import get_user_client


class ItemDAO:
    """Handle database operations for items"""

    def _table(self, token: str):
        return get_user_client(token).table(Item.db_table())

    def fetch_items(self, token: str, list_id: int) -> List[Item]:
        """A list's items: still-needed first, then most urgent, then oldest."""
        response = (
            self._table(token)
            .select("*")
            .eq(Item.column("list_id"), list_id)
            .order(Item.column("bought"))
            .order(Item.column("priority"), desc=True)
            .order(Item.column("created_at"))
            .execute()
        )
        return [Item.from_row(row) for row in response.data]

    def fetch_item(self, token: str, list_id: int, item_id: int) -> Optional[Item]:
        """One item on a list; None if it does not exist or the user cannot see it."""
        response = (
            self._table(token)
            .select("*")
            .eq(Item.column("list_id"), list_id)
            .eq(Item.column("id"), item_id)
            .limit(1)
            .execute()
        )
        return Item.from_row(response.data[0]) if response.data else None

    def create_item(self, token: str, item: Item) -> Item:
        """Insert an item; RLS only allows it on a list in the user's household."""
        response = self._table(token).insert(item.to_row()).execute()
        return Item.from_row(response.data[0])

    def update_item(self, token: str, list_id: int, item_id: int, changes: Dict[str, Any]) -> Optional[Item]:
        """Apply field changes (keyed by model field name); None if no such item is visible."""
        values = {Item.column(field): value for field, value in changes.items()}
        response = (
            self._table(token)
            .update(values)
            .eq(Item.column("list_id"), list_id)
            .eq(Item.column("id"), item_id)
            .execute()
        )
        return Item.from_row(response.data[0]) if response.data else None

    def delete_item(self, token: str, list_id: int, item_id: int) -> bool:
        """Delete an item; False if no such item is visible to the user."""
        response = (
            self._table(token)
            .delete()
            .eq(Item.column("list_id"), list_id)
            .eq(Item.column("id"), item_id)
            .execute()
        )
        return bool(response.data)
