"""
Item routes: list, get, add, edit, tick bought, delete.
Supabase is mocked: require_auth's token check, the item DAO and the list
lookup that checks the list belongs to the household and the user is a member.
"""

from dataclasses import replace
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from schema import Item, Priority, ShoppingList

USER_ID = "2b1f0c3e-0000-4000-8000-000000000001"
AUTH = {"Authorization": "Bearer good-token"}
ITEMS_URL = "/api/households/5/shopping-lists/3/items"

DAO_METHODS = {
    "list": "fetch_items",
    "get": "fetch_item",
    "create": "create_item",
    "update": "update_item",
    "delete": "delete_item",
}


@pytest.fixture()
def signed_in(monkeypatch):
    admin = MagicMock()
    admin.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(id=USER_ID))
    monkeypatch.setattr("auth.decorators.get_admin_client", lambda: admin)


@pytest.fixture()
def list_visible(monkeypatch):
    fetch = MagicMock(return_value=ShoppingList(id=3, name="Weekly shop", household_id=5))
    monkeypatch.setattr("lists.ListDAO.ListDAO.fetch_list", fetch)
    return fetch


@pytest.fixture()
def list_hidden(monkeypatch):
    monkeypatch.setattr("lists.ListDAO.ListDAO.fetch_list", MagicMock(return_value=None))


@pytest.fixture()
def dao(monkeypatch):
    mocks = SimpleNamespace(**{name: MagicMock() for name in DAO_METHODS})
    for name, method in DAO_METHODS.items():
        monkeypatch.setattr(f"items.ItemDAO.ItemDAO.{method}", getattr(mocks, name))
    return mocks


def item(id=1, name="Milk", priority=Priority.MEDIUM, quantity=2, notes=None, bought=False):
    return Item(id=id, name=name, list_id=3, priority=priority, quantity=quantity, notes=notes,
                bought=bought, created_at="2026-10-27T00:00:00Z")


@pytest.mark.parametrize("method,path", [
    ("GET", ITEMS_URL), ("POST", ITEMS_URL), ("GET", ITEMS_URL + "/1"), ("PUT", ITEMS_URL + "/1"),
    ("PUT", ITEMS_URL + "/1/toggle"), ("DELETE", ITEMS_URL + "/1"),
])
def test_item_routes_require_a_token(client, method, path):
    assert client.open(path, method=method, json={"name": "x"}).status_code == 401


def test_lists_items_with_name_quantity_and_priority(client, signed_in, list_visible, dao):
    dao.list.return_value = [item(1, "Milk", Priority.HIGH, 2), item(2, "Bread", Priority.NONE, None)]

    response = client.get(ITEMS_URL, headers=AUTH)

    assert response.status_code == 200
    assert [(i["name"], i["quantity"], i["priority"]) for i in response.get_json()] == [
        ("Milk", 2, 3),
        ("Bread", None, 0),
    ]
    list_visible.assert_called_once_with("good-token", 5, 3)
    dao.list.assert_called_once_with("good-token", 3)


def test_items_404_when_list_not_in_household_or_not_a_member(client, signed_in, list_hidden, dao):
    assert client.get(ITEMS_URL, headers=AUTH).status_code == 404
    assert client.post(ITEMS_URL, json={"name": "Milk"}, headers=AUTH).status_code == 404
    assert client.delete(ITEMS_URL + "/1", headers=AUTH).status_code == 404
    dao.list.assert_not_called()
    dao.create.assert_not_called()
    dao.delete.assert_not_called()


def test_add_item_saves_name_quantity_priority_and_notes(client, signed_in, list_visible, dao):
    dao.create.side_effect = lambda token, new_item: replace(new_item, id=9)

    response = client.post(
        ITEMS_URL,
        json={"name": " Milk ", "quantity": 2, "priority": 3, "notes": " semi-skimmed "},
        headers=AUTH,
    )

    assert response.status_code == 201
    token, new_item = dao.create.call_args.args
    assert token == "good-token"
    assert new_item.to_row() == {
        "item_name": "Milk",
        "item_list_id": 3,
        "item_priority": 3,
        "item_store_id": None,
        "item_quantity": 2,
        "item_notes": "semi-skimmed",
        "item_bought": False,
    }
    assert response.get_json()["OHID"] == 9


def test_add_item_defaults_to_no_priority(client, signed_in, list_visible, dao):
    dao.create.side_effect = lambda token, new_item: new_item
    client.post(ITEMS_URL, json={"name": "Bread"}, headers=AUTH)
    assert dao.create.call_args.args[1].priority is Priority.NONE


@pytest.mark.parametrize("body", [
    {},
    {"name": "  "},
    {"name": "x" * 256},
    {"name": "Milk", "priority": 4},
    {"name": "Milk", "priority": "HIGH"},
    {"name": "Milk", "priority": True},
    {"name": "Milk", "quantity": 0},
    {"name": "Milk", "quantity": 1.5},
    {"name": "Milk", "quantity": "2"},
    {"name": "Milk", "notes": "x" * 1001},
])
def test_add_item_rejects_invalid_fields(client, signed_in, list_visible, dao, body):
    assert client.post(ITEMS_URL, json=body, headers=AUTH).status_code == 400
    dao.create.assert_not_called()


def test_get_item(client, signed_in, list_visible, dao):
    dao.get.return_value = item(4)
    response = client.get(ITEMS_URL + "/4", headers=AUTH)
    assert response.status_code == 200
    assert response.get_json()["OHID"] == 4
    dao.get.assert_called_once_with("good-token", 3, 4)


def test_edit_item_sends_only_changed_fields(client, signed_in, list_visible, dao):
    dao.update.return_value = item(4, name="Oat milk", quantity=None)

    response = client.put(ITEMS_URL + "/4", json={"name": "Oat milk", "quantity": None, "priority": 1},
                          headers=AUTH)

    assert response.status_code == 200
    dao.update.assert_called_once_with("good-token", 3, 4, {"name": "Oat milk", "quantity": None, "priority": 1})


def test_edit_item_rejects_empty_or_invalid_changes(client, signed_in, list_visible, dao):
    assert client.put(ITEMS_URL + "/4", json={}, headers=AUTH).status_code == 400
    assert client.put(ITEMS_URL + "/4", json={"bought": "yes"}, headers=AUTH).status_code == 400
    dao.update.assert_not_called()


def test_edit_missing_item_is_404(client, signed_in, list_visible, dao):
    dao.update.return_value = None
    assert client.put(ITEMS_URL + "/4", json={"name": "Oat milk"}, headers=AUTH).status_code == 404


def test_toggle_flips_bought(client, signed_in, list_visible, dao):
    dao.get.return_value = item(4, bought=False)
    dao.update.return_value = item(4, bought=True)

    response = client.put(ITEMS_URL + "/4/toggle", headers=AUTH)

    assert response.status_code == 200
    assert response.get_json()["bought"] is True
    dao.update.assert_called_once_with("good-token", 3, 4, {"bought": True})


def test_delete_item(client, signed_in, list_visible, dao):
    dao.delete.return_value = True
    response = client.delete(ITEMS_URL + "/4", headers=AUTH)
    assert response.status_code == 204
    dao.delete.assert_called_once_with("good-token", 3, 4)


def test_delete_missing_item_is_404(client, signed_in, list_visible, dao):
    dao.delete.return_value = False
    assert client.delete(ITEMS_URL + "/4", headers=AUTH).status_code == 404
