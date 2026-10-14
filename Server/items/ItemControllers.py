"""
Items Controllers
Business logic for shopping list item operations
"""

from typing import List, Optional, Dict, Any

from items.ItemDAO import ItemDAO
from schema import Priority


class ItemController:
    """Handle shopping list item business logic and operations"""

    itemDB = ItemDAO()  # Data Access Object for item-related database operations
    
    item_name = "Example Item"

    def __init__(self):
        pass
    

    def get_all_items(self, list_id: str) -> List[Dict[str, Any]]:
        """Fetch all items on a specific shopping list"""

        return self.item.fetch_items_by_list_id(list_id)
    
    
    def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific item"""
        return self.item.fetch_item(item_id)
    
    def get_item_priority(self, item_id: str) -> Optional[Priority]:
        """Fetch the priority level of a specific item"""
        value = self.itemDB.fetch_priority_of_item(item_id)
        return None if value is None else Priority(value)

    def create_item(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new item on a list"""

        return self.item.create_item(data)
    
    def update_item(self, item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an item"""
        pass
    
    def delete_item(self, item_id: str) -> bool:
        """Delete an item"""
        pass
    
    def mark_item_purchased(self, item_id: str) -> Dict[str, Any]:
        """Mark an item as purchased"""
        pass
    
    def get_items_by_priority(self, list_id: str, priority: Priority) -> List[Dict[str, Any]]:
        """Get items filtered by priority"""
        pass
