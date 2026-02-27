from dataclasses import dataclass


@dataclass
class Member:
    OHID: int
    user_id: str
    household_id: str
