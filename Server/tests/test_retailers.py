"""
Retailer routes: list the retailers a store can be linked to.
Supabase is mocked: require_auth's token check and the retailer DAO.
"""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import Retailer

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
AUTH = {"Authorization": "Bearer good-token"}


@pytest.fixture()
def signed_in(monkeypatch):
    admin = MagicMock()
    admin.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=USER_ID))
    monkeypatch.setattr("auth.decorators.get_admin_client", lambda: admin)


def test_retailers_require_a_token(client):
    assert client.get("/api/retailers").status_code == 401


def test_lists_retailers(client, signed_in, monkeypatch):
    fetch = MagicMock(return_value=[
        Retailer(key="aldi", name="Aldi", homepage="https://www.aldi.co.uk",
                 search_url="https://www.aldi.co.uk/results?q={query}"),
        Retailer(key="coop", name="Co-op", homepage="https://www.coop.co.uk"),
    ])
    monkeypatch.setattr("retailers.RetailerDAO.RetailerDAO.fetch_retailers", fetch)

    response = client.get("/api/retailers", headers=AUTH)

    assert response.status_code == 200
    assert response.get_json() == [
        {"key": "aldi", "name": "Aldi", "homepage": "https://www.aldi.co.uk",
         "searchUrl": "https://www.aldi.co.uk/results?q={query}", "retired": False},
        {"key": "coop", "name": "Co-op", "homepage": "https://www.coop.co.uk",
         "searchUrl": None, "retired": False},
    ]
    fetch.assert_called_once_with("good-token")
