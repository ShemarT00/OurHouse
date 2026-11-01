"""
OurHouse Server Application
Flask application with Blueprint-based architecture
"""

# Verify TLS certificates against the operating system's trust store (needed on
# machines where HTTPS goes through a proxy or antivirus with its own root CA).
# Must run before anything opens an HTTPS connection to Supabase.
try:
    import truststore

    truststore.inject_into_ssl()
except ImportError:  # Python < 3.10: fall back to certifi's bundled CAs
    pass

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()


def create_app(config=None):
    """
    Application factory function
    Creates and configures the Flask application

    Parameters:
        config (dict, optional): Overrides applied after the defaults (used by tests)
    """
    app = Flask(__name__)

    # Configuration
    # WARNING: The fallback SECRET_KEY is for local development only; set SECRET_KEY in production
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    app.config["ENV"] = os.getenv("FLASK_ENV", "development")
    if config:
        app.config.update(config)

    # Enable CORS for frontend requests
    CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})

    # Register blueprints
    from users import users_bp
    from households import households_bp
    from members import members_bp
    from lists import lists_bp
    from items import items_bp
    from stores import stores_bp
    from retailers import retailers_bp
    from notifications import notifications_bp

    app.register_blueprint(users_bp)
    app.register_blueprint(households_bp)
    app.register_blueprint(members_bp)
    app.register_blueprint(lists_bp)
    app.register_blueprint(items_bp)
    app.register_blueprint(stores_bp)
    app.register_blueprint(retailers_bp)
    app.register_blueprint(notifications_bp)

    # Centralized error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized", "message": str(e)}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "message": str(e)}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": str(e)}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method Not Allowed", "message": str(e)}), 405

    @app.errorhandler(501)
    def not_implemented(e):
        return jsonify({"error": "Not Implemented", "message": str(e)}), 501

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return jsonify({"error": e.name, "message": e.description}), e.code

    @app.errorhandler(Exception)
    def handle_exception(e):
        if isinstance(e, HTTPException):
            return handle_http_exception(e)
        # WARNING: Logs the full exception internally; only a generic message is returned to the client
        app.logger.error(f"Unhandled exception: {e}", exc_info=True)
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred"}), 500

    # Health check endpoint (/health kept as an alias)
    @app.route("/api/health", methods=["GET"])
    @app.route("/health", methods=["GET"])
    def health():
        return {"status": "healthy"}, 200

    # API version endpoint
    @app.route("/api/version", methods=["GET"])
    def version():
        return {"version": "1.0.0", "name": "OurHouse API"}, 200

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 5000)),
        debug=os.getenv("FLASK_ENV") == "development",
    )
