from dataclasses import dataclass


# Detailing out the User Profile, which includes the OHID, name, and email attributes. The OHID serves as a unique identifier for each user, while the name and email provide essential contact information.

@dataclass
class User:
    OHID: int
    first_name: str
    last_name: str
    email: str
    invite_code: str

def __init__(
    self,
    OHID: int,
    first_name: str,
    last_name: str,
    email: str,
    invite_code: str,
):
    self.OHID = OHID
    self.first_name = first_name
    self.last_name = last_name
    self.email = email
    self.invite_code = invite_code

def getFullName(self) -> str:
    return f"{self.first_name} {self.last_name}"

 
