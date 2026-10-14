"""
Lists Controllers
Business logic for shopping list operations
"""
from lists.ListDAO import ListDAO
from items.ItemDAO import ItemDAO
from typing import List, Optional, Dict, Any


class ListController:
    """Handle shopping list business logic and operations"""

    listDB = ListDAO()  # Data Access Object for list-related database operations
    listTypeName = ""
    isListEmpty = True
    listItemCount = 0
    listItemNames = []

# TODO create variable names based off of the TABLE COLUMNS 


    
    def __init__(self):
        pass
    
    def get_lists(self, household_id: str) -> List[Dict[str, Any]]:
        """Fetch all shopping lists for a household"""
        pass
    
    def get_list(self, list_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific shopping list"""
        pass
    
    def get_item_count(self, list_id: str) -> int:

        """Fetch the number of items on a specific shopping list"""

        self.listItemCount = self.listDB.fetch_item_count(list_id)
        return self.listItemCount
    
    # TODO retrieve items in the list ordered by priority using functions in ListDAO and return the list of item names in the order of priority (urgent, medium, low, unprioritized)

    # TODO retrieve items in the list ordered by priority using functions in ListDAO and return the list of item names in the order of priority (unprioritized, low, medium, urgent)

    

    def new_list (self, data: Dict[str, Any]) -> str:

        """Call create_list method then return a message confirming the creation of the list with the new list's name"""

        list_info = self.create_list_db(data)
        if list_info:
            return f"Successfully created list '{list_info['list_name']}'"
        return "Failed to create list"
    


    def create_list_db(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new shopping list"""
        return self.listDB.create_list(data)
    
    def change_list_name(self, list_id: str, data: Dict[str, Any]) -> str:
        """Call update_list method then return a message confirming the update of the list with the updated list's name"""

        updated_list_info = self.listDB.update_list(list_id, data)
        if updated_list_info:
            return f"Successfully updated list name to '{updated_list_info['list_name']}'"
        return "Failed to update list name"
    
    def delete_list(self, list_id: str) -> bool:
        """Delete a shopping list"""

        return self.listDB.delete_list(list_id)
        
    
