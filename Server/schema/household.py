from dataclasses import dataclass


@dataclass
class Household:
    OHID: int
    name: str

# Constructor for the Household class that initializes the OHID and name attributes.

    def __init__(self, OHID: int, name: str):
        self.OHID = OHID
        self.name = name

# The Household class represents a household entity with an OHID (Object House ID) and a name.
# The OHID is a unique identifier for the household, while the name is a string representing the household's name.


