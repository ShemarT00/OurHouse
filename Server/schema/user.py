from dataclasses import dataclass


@dataclass
class User:
    OHID: int
    name: str
    email: str
