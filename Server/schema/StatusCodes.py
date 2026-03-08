from dataclasses import dataclass



@dataclass
class Codes:
    """
    A class to represent the various status codes used in the application.
    """

    # General status codes
    SUCCESS: int = 200
    BAD_REQUEST: int = 400
    UNAUTHORIZED: int = 401
    FORBIDDEN: int = 403
    NOT_FOUND: int = 404
    INTERNAL_SERVER_ERROR: int = 500

    # Custom application-specific codes
    USER_ALREADY_EXISTS: int = 1001
    INVALID_CREDENTIALS: int = 1002
    ACCOUNT_LOCKED: int = 1003

    