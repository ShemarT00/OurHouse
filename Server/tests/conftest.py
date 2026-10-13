"""
Shared pytest fixtures for the OurHouse test suite.
"""

import pytest
import sys
import os

# Ensure the Server directory is on the path so app imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(scope="session")
def app():
    """Create the Flask app configured for testing."""
    from app import create_app

    flask_app = create_app({"TESTING": True, "SECRET_KEY": "test-secret-key"})
    yield flask_app


@pytest.fixture()
def client(app):
    """A test client for the app."""
    return app.test_client()
