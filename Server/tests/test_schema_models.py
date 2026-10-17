"""
Round-trip between models and Supabase rows (keyed by Postgres' lowercase column names).
"""

from schema import Item, Member, Priority, User


def test_item_from_row_converts_priority():
    item = Item.from_row({
        "item_id": 7,
        "item_name": "Milk",
        "item_list_id": 3,
        "item_priority": 2,
        "item_bought": False,
        "item_created_at": "2026-10-14T00:00:00Z",
    })
    assert item.priority is Priority.MEDIUM
    assert item.id == 7
    assert item.quantity is None


def test_to_row_omits_unset_server_generated_columns():
    row = Item(name="Bread", list_id=3, priority=Priority.HIGH).to_row()
    assert row["item_priority"] == 3
    assert "item_id" not in row
    assert "item_created_at" not in row
    assert row["item_store_id"] is None


def test_table_names_match_postgres():
    assert User.db_table() == "USER"
    assert Item.db_table() == "item"


def test_member_round_trip():
    member = Member(
        user_id="2b1f0c3e-0000-4000-8000-000000000001",
        household_id=2,
        first_name="Ada",
        last_name="Lovelace",
        is_admin=True,
        id=5,
    )
    assert Member.from_row(member.to_row()) == member
