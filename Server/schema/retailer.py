from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Retailer(TableModel):
    """An online shop OurHouse knows how to open and search; the same for every household.

    Filled by migrations only. `search_url` contains "{query}" where the item
    name goes, or is None if the retailer cannot search by item name.
    """

    TABLE = "RETAILER"
    PREFIX = "RETA_"

    key: str
    name: str
    homepage: str
    search_url: Optional[str] = None
    retired: bool = False
