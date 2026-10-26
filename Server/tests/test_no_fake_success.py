"""
Routes that are not implemented yet must say so (501) instead of returning
success for work they did not do.
"""

import re

import pytest

# Endpoints with a real implementation, keyed by (method, rule)
IMPLEMENTED = {
    ("GET", "/health"),
    ("GET", "/api/health"),
    ("GET", "/api/version"),
    ("GET", "/api/users/profile"),
    ("GET", "/api/households"),
    ("POST", "/api/households"),
    ("GET", "/api/households/<int:household_id>"),
    ("POST", "/api/households/join"),
    ("GET", "/api/households/<int:household_id>/members"),
}

# Endpoints that check authentication before reaching their stub body
AUTH_REQUIRED_PREFIXES = ("/api/households/<household_id>/members",)


def _endpoints():
    from app import create_app

    app = create_app({"TESTING": True})
    for rule in app.url_map.iter_rules():
        if rule.endpoint == "static":
            continue
        for method in sorted(rule.methods - {"HEAD", "OPTIONS"}):
            if (method, rule.rule) not in IMPLEMENTED:
                yield method, rule.rule


@pytest.mark.parametrize("method,rule", list(_endpoints()))
def test_unimplemented_routes_return_501(client, method, rule):
    path = re.sub(r"<(?:\w+:)?(\w+)>", "1", rule)
    response = client.open(path, method=method, json={})

    if rule.startswith(AUTH_REQUIRED_PREFIXES):
        assert response.status_code == 401
    else:
        assert response.status_code == 501
    assert set(response.get_json()) == {"error", "message"}
