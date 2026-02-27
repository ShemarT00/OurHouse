from dataclasses import dataclass

@dataclass
class Member:
    OHID: int
    user_id: str
    household_id: str
    first_name: str
    last_name: str

def __init__(
    self,
    OHID: int,
    user_id: str,
    household_id: str,
    first_name: str,
    last_name: str,
):
    self.OHID = OHID
    self.user_id = user_id
    self.household_id = household_id
    self.first_name = first_name
    self.last_name = last_name

def getFullName(self) -> str:
    return f"{self.first_name} {self.last_name}"

def isAdmin(self) -> bool:
    # Placeholder for admin check logic, can be implemented based on specific requirements
    return False