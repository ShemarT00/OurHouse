"""
Retailers Controllers
Business logic for retailers
"""

from typing import Any, Dict, List, Optional

from .RetailerDAO import RetailerDAO


class RetailerController:
    """Handle retailer business logic and operations"""

    def __init__(self, dao: Optional[RetailerDAO] = None):
        self._dao = dao or RetailerDAO()

    def list_retailers(self, token: str) -> List[Dict[str, Any]]:
        """Retailers a store can be linked to, by name."""
        return [retailer.to_api() for retailer in self._dao.fetch_retailers(token)]
