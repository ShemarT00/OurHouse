from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass
class Item:
    OHID: int
    name: str
    priority: Priority
    shopping_list_id: str
    store_id: Optional[str] = None
    quantity: Optional[int] = None
    notes: Optional[str] = None
    

    def __init__(
        self,
        OHID: int,
        name: str,
        priority: Priority,
        shopping_list_id: str,
        store_id: Optional[str] = None,
        quantity: Optional[int] = None,
        notes: Optional[str] = None,
    ):
        self.OHID = OHID
        self.name = name
        self.priority = priority
        self.shopping_list_id = shopping_list_id
        self.store_id = store_id
        self.quantity = quantity
        self.notes = notes

