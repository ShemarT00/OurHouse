"""
Items Controllers
Business logic for shopping list item operations
"""

from typing import List, Optional, Dict, Any


class ItemController:
    """Handle shopping list item business logic and operations"""
    
    def __init__(self):
        pass
    
    def get_all_items(self, list_id: str) -> List[Dict[str, Any]]:
        """Fetch all items on a specific shopping list"""
        
        pass
    
    def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific item"""
        pass
    
    def get_item_priority(self, item_id: str) -> Optional[int]:
        """Fetch the priority level of a specific item"""
        pass

    def create_item(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new item on a list"""
        pass
    
    def update_item(self, item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an item"""
        pass
    
    def delete_item(self, item_id: str) -> bool:
        """Delete an item"""
        pass
    
    def mark_item_purchased(self, item_id: str) -> Dict[str, Any]:
        """Mark an item as purchased"""
        pass
    
    def get_items_by_priority(self, list_id: str, priority: str) -> List[Dict[str, Any]]:
        """Get items filtered by priority"""
        pass
