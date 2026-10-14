"""
Tests for the core Flask application (health check, versioning, error handlers).
"""


import pytest


@pytest.mark.parametrize("path", ["/api/health", "/health"])
def test_health_check(client, path):
    response = client.get(path)
    assert response.status_code == 200
    assert response.get_json() == {"status": "healthy"}


def test_version_endpoint(client):
    response = client.get("/api/version")
    assert response.status_code == 200
    data = response.get_json()
    assert data["version"] == "1.0.0"
    assert data["name"] == "OurHouse API"


def test_404_returns_json(client):
    response = client.get("/api/does-not-exist")
    assert response.status_code == 404
    data = response.get_json()
    assert data["error"] == "Not Found"


def test_405_returns_json(client):
    # /health only accepts GET — POST should return 405
    response = client.post("/health")
    assert response.status_code == 405
    data = response.get_json()
    assert data["error"] == "Method Not Allowed"
