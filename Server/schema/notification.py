from dataclasses import dataclass


@dataclass
class Notification:
    OHID: int
    member_id: str
    message: str
    created_at: str
