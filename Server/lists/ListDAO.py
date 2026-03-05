"""
Lists DAO (Data Access Object)
Database operations for shopping lists
"""

from typing import List, Optional, Dict, Any


class ListDAO:
    """Handle database operations for shopping lists"""
    
    def __init__(self):
        pass
    
    def fetch_lists(self, household_id: str) -> List[Dict[str, Any]]:
        """Query all lists for a household"""
        pass
    
    def fetch_list(self, list_id: str) -> Optional[Dict[str, Any]]:
        """Query a specific list"""
        pass
        
    def fetch_item_count(self, list_id: str) -> int:
        """Query the number of items on a specific list"""
        
        query = "SELECT COUNT(*) FROM ITEM WHERE ITEM_LIST_ID = %s"
        params = (list_id,)

        result = self.db.execute(query, params)
        
        return result[0][0] if result else 0  # Return the count from the first row, or 0 if no items found
    
    def create_list(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new list"""

        query = "INSERT INTO SHOPPING_LIST (LIST_NAME, HOUSEHOLD_ID) VALUES (%s, %s) RETURNING LIST_ID, LIST_NAME, HOUSEHOLD_ID"
        params = (data['list_name'], data['household_id'])


        result = self.db.execute(query, params)
        if result:
            return {
                "list_id": result[0][0],
                "list_name": result[0][1],
                "household_id": result[0][2]
            }
        return {}
    
    def update_list(self, list_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        
        query = "UPDATE SHOPPING_LIST SET LIST_NAME = %s WHERE LIST_ID = %s RETURNING LIST_ID, LIST_NAME, HOUSEHOLD_ID"
        params = (data['list_name'], list_id)
        result = self.db.execute(query, params)
        if result:
            return {
                "list_id": result[0][0],
                "list_name": result[0][1],
                "household_id": result[0][2]
            }   

        pass
    
    def delete_list(self, list_id: str) -> bool:
        """Delete a list"""

        query = "DELETE FROM SHOPPING_LIST WHERE LIST_ID = %s"
        params = (list_id,)
        result = self.db.execute(query, params)
        return result is not None
            

        pass
    
    def fetch_active_lists(self, household_id: str) -> List[Dict[str, Any]]:
        """Query only active (non-archived) lists"""
        pass
