from dataclasses import dataclass


@dataclass
class ShoppingList:
    OHID: int
    name: str
    household_id: str

def __init__(self, OHID: int, name: str, household_id: str):
    self.OHID = OHID
    self.name = name
    self.household_id = household_id

def getHouseholdID(self) -> str:
    return self.household_id

