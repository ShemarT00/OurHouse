"""
Items DAO (Data Access Object)
Database operations for shopping list items
"""

from typing import List, Optional, Dict, Any


class ItemDAO:
    """Handle database operations for shopping list items"""
    
    def __init__(self):
        pass


# Fetch Queries   
    def fetch_all_items(self, list_id: str) -> List[Dict[str, Any]]:
        """Query all items on a specific shopping list"""
        query = "SELECT * FROM ITEM WHERE ITEM_LIST_ID = %s"
        params = (list_id,)
        # Execute the query and return the list of items
    
    def fetch_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        
        query = "SELECT * FROM ITEM WHERE ITEM_ID = %s"
        params = (item_id,)

        result = self.db.execute(query, params)
        
        if result:
            return result[0]
        return None


# Other Queries
    def item_bought(self, item_id: str) -> bool:
        """Mark an item as purchased"""
        query = "UPDATE ITEM SET ITEM_BOUGHT = TRUE WHERE ITEM_ID = %s"
        result = self.db.execute(query, (item_id,))
        return result is not None

# Priority Queries
    def fetch_priority_of_item(self, item_id: str) -> int:

        query = "SELECT ITEM_PRIORITY FROM ITEM WHERE ITEM_ID = %s"

        result = self.db.execute(query, (item_id,))
        
        # Execute the query and return the priority value
        # return integer of priority level (0, 1, 2, 3) or None if item not found
        if result:
            return result[0][0]  # Return the priority value from the first row
        return None  # Return None if no item found
    
    def change_item_priority(self, item_id: str, new_priority: int) -> Optional[Dict[str, Any]]:
        
        query = "UPDATE ITEM SET ITEM_PRIORITY = %s WHERE ITEM_ID = %s RETURNING ITEM_ID, ITEM_NAME, ITEM_PRIORITY, ITEM_LIST_ID, ITEM_STORE_ID, ITEM_QUANTITY"
        params = (new_priority, item_id)

        result = self.db.execute(query, params)
        
        if result:
            return result[0]  # Return the updated item details
        return None  # Return None if no item found or update failed
    
    def fetch_desc_order_priority_items(self, list_id: str) -> List[Dict[str, Any]]:

        query = "SELECT ITEM_NAME, ITEM_PRIORITY, ITEM_QUANTITY FROM ITEM WHERE ITEM_LIST_ID = %s ORDER BY ITEM_PRIORITY DESC"
        params = (list_id,)
        # Execute the query and return the list of items in descending priority order

        result = self.db.execute(query, params)
        return result.fetchall()  # Return all items as a list of dictionaries
    
    def fetch_asc_order_priority_items(self, list_id: str) -> List[Dict[str, Any]]:

        query = "SELECT ITEM_NAME, ITEM_PRIORITY, ITEM_QUANTITY FROM ITEM WHERE ITEM_LIST_ID = %s ORDER BY ITEM_PRIORITY ASC"
        params = (list_id,)
        # Execute the query and return the list of items in ascending priority order

        result = self.db.execute(query, params)
        return result.fetchall()  # Return all items as a list of dictionaries



# CRUD Operations

    def create_item(self, data: Dict[str, Any]) -> Dict[str, Any]:
        
        """Create a new item on a list"""

        query = """INSERT INTO ITEM (ITEM_NAME, ITEM_PRIORITY, ITEM_LIST_ID, ITEM_STORE_ID, ITEM_QUANTITY) 
                   VALUES (%s, %s, %s, %s, %s) RETURNING ITEM_ID, ITEM_NAME, ITEM_PRIORITY, ITEM_LIST_ID, ITEM_STORE_ID, ITEM_QUANTITY"""
        params = (
            data["item_name"],
            data["item_priority"],
            data["item_list_id"],
            data["item_store_id"],
            data["item_quantity"]
        )
        result = self.db.execute(query, params)
        if result:
            return result[0]
        return None
    
    def update_item(self, item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an item"""

        query = """UPDATE ITEM SET ITEM_NAME = %s, ITEM_PRIORITY = %s, ITEM_LIST_ID = %s, ITEM_STORE_ID = %s, ITEM_QUANTITY = %s
                   WHERE ITEM_ID = %s RETURNING ITEM_ID, ITEM_NAME, ITEM_PRIORITY, ITEM
                     _LIST_ID, ITEM_STORE_ID, ITEM_QUANTITY"""
        params = (
            data["item_name"],  
            data["item_priority"],
            data["item_list_id"],
            data["item_store_id"],
            data["item_quantity"],
            item_id
        )
        result = self.db.execute(query, params)
        if result:
            return result[0]
        return None
    
    def delete_item(self, item_id: str) -> bool:
        """Delete an item"""
        query = "DELETE FROM ITEM WHERE ITEM_ID = %s"
        result = self.db.execute(query, (item_id,))
        return result is not None
    
    def fetch_unpurchased_items(self, list_id: str) -> List[Dict[str, Any]]:
        """Query items not yet marked as purchased"""
        pass
