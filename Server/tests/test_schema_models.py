"""
Round-trip between models and Supabase rows.
"""

from schema import Item, Member, Priority


def test_item_from_row_converts_priority():
    item = Item.from_row({
        "ITEM_ID": 7,
        "ITEM_NAME": "Milk",
        "ITEM_LIST_ID": 3,
        "ITEM_PRIORITY": 2,
        "ITEM_BOUGHT": False,
        "ITEM_CREATED_AT": "2026-10-14T00:00:00Z",
    })
    assert item.priority is Priority.MEDIUM
    assert item.id == 7
    assert item.quantity is None


def test_to_row_omits_unset_server_generated_columns():
    row = Item(name="Bread", list_id=3, priority=Priority.HIGH).to_row()
    assert row["ITEM_PRIORITY"] == 3
    assert "ITEM_ID" not in row
    assert "ITEM_CREATED_AT" not in row
    assert row["ITEM_STORE_ID"] is None


def test_member_round_trip():
    member = Member(user_id=1, household_id=2, first_name="Ada", last_name="Lovelace", is_admin=True, id=5)
    assert Member.from_row(member.to_row()) == member
