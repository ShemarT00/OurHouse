"""
Client types are generated from the server models; fail if they drift apart.
"""

from scripts.gen_client_types import OUTPUT_PATH, render


def test_generated_client_types_are_up_to_date():
    committed = OUTPUT_PATH.read_text(encoding="utf-8")
    assert committed == render(), (
        "Client/types/generated.ts is out of date. "
        "Run: python Server/scripts/gen_client_types.py"
    )
