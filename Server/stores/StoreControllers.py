"""
Stores Controllers
Business logic for a household's stores
"""

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlsplit

from households.HouseholdDAO import HouseholdDAO
from retailers.RetailerDAO import RetailerDAO
from schema import Store

from .StoreDAO import StoreDAO

MAX_NAME_LENGTH = 255
MAX_WEBSITE_LENGTH = 2048

WEBSITE_ERROR = "Website must be a web address, like www.example.com"
HAS_SCHEME = re.compile(r"^[a-z][a-z0-9+.-]*://", re.I)
HOST_LABEL = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$", re.I)
TOP_LEVEL_DOMAIN = re.compile(r"^[a-z]{2,63}$", re.I)


def _name(value: Any) -> str:
    name = value.strip() if isinstance(value, str) else ""
    if not name or len(name) > MAX_NAME_LENGTH:
        raise ValueError(f"Store name must be 1-{MAX_NAME_LENGTH} characters")
    return name


def _retailer_key(value: Any) -> Optional[str]:
    if value is None:
        return None
    if not isinstance(value, str) or not value:
        raise ValueError("retailerKey must be a retailer's key or null")
    return value


def _website(value: Any) -> Optional[str]:
    """An http(s) address with a domain; https:// is added when no scheme is given. Blank means none."""
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(WEBSITE_ERROR)
    website = value.strip()
    if not website:
        return None
    if not HAS_SCHEME.match(website):
        website = "https://" + website
    parts = urlsplit(website)
    try:
        parts.port  # raises for a port that is not a number
    except ValueError:
        raise ValueError(WEBSITE_ERROR) from None
    labels = (parts.hostname or "").split(".")
    if (
        parts.scheme.lower() not in ("http", "https")
        or "@" in parts.netloc  # user:password@host hides the real destination
        or any(c.isspace() for c in website)
        or len(labels) < 2
        or not all(HOST_LABEL.match(label) for label in labels)
        or not TOP_LEVEL_DOMAIN.match(labels[-1])
        or len(website) > MAX_WEBSITE_LENGTH
    ):
        raise ValueError(WEBSITE_ERROR)
    return parts.scheme.lower() + website[len(parts.scheme):]


def _link(body: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """The store's link from a request body, as both fields (the one not chosen is cleared).

    Empty if the body sets neither retailerKey nor website.
    """
    if "retailerKey" not in body and "website" not in body:
        return {}
    link = {"retailer_key": _retailer_key(body.get("retailerKey")), "website": _website(body.get("website"))}
    if link["retailer_key"] is not None and link["website"] is not None:
        raise ValueError("Choose a retailer or a website, not both")
    return link


class StoreController:
    """Handle store business logic and operations"""

    def __init__(self, dao: Optional[StoreDAO] = None, household_dao: Optional[HouseholdDAO] = None,
                 retailer_dao: Optional[RetailerDAO] = None):
        self._dao = dao or StoreDAO()
        self._household_dao = household_dao or HouseholdDAO()
        self._retailer_dao = retailer_dao or RetailerDAO()

    def _can_see_household(self, token: str, household_id: int) -> bool:
        # RLS hides households the user is not a member of
        return self._household_dao.fetch_household(token, household_id) is not None

    def _check_retailer(self, token: str, retailer_key: Optional[str]) -> None:
        # The database refuses unknown keys; retired retailers are not offered either
        if retailer_key is None:
            return
        retailer = self._retailer_dao.fetch_retailer(token, retailer_key)
        if retailer is None or retailer.retired:
            raise ValueError("Retailer not found")

    def list_stores(self, token: str, household_id: int) -> Optional[List[Dict[str, Any]]]:
        """A household's stores, or None if the household does not exist or the user is not a member."""
        if not self._can_see_household(token, household_id):
            return None
        return [store.to_api() for store in self._dao.fetch_stores(token, household_id)]

    def create_store(self, token: str, household_id: int, body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add a store (name, optional retailerKey or website) to a household; None if the user is not a member.

        Raises ValueError for an invalid or duplicate name, or an invalid link.
        """
        store = Store(name=_name(body.get("name")), household_id=household_id, **_link(body))
        if not self._can_see_household(token, household_id):
            return None
        self._check_retailer(token, store.retailer_key)
        return self._dao.create_store(token, store).to_api()

    def update_store(self, token: str, household_id: int, store_id: int,
                     body: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Change a store's name and/or link; None if the store is not in this household or not visible.

        Raises ValueError for an invalid or duplicate name, or an invalid link.
        """
        changes: Dict[str, Any] = _link(body)
        if "name" in body:
            changes["name"] = _name(body["name"])
        if not changes:
            raise ValueError("Nothing to update")
        if not self._can_see_household(token, household_id):
            return None
        self._check_retailer(token, changes.get("retailer_key"))
        store = self._dao.update_store(token, household_id, store_id, changes)
        return None if store is None else store.to_api()
