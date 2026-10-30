"""
Notifications Routes
API endpoints for notification management
"""

from flask import abort, g
from auth.decorators import require_auth
from notifications import notifications_bp
from notifications.NotifControllers import NotificationController

_notification_controller = NotificationController()


@notifications_bp.route("", methods=["GET"])
@require_auth
def list_notifications():
    """
    Get the signed-in member's inbox: their notifications from the last
    30 days, newest first

    Returns:
        List of notification objects
    """
    return _notification_controller.list_notifications(g.token), 200


@notifications_bp.route("/unread-count", methods=["GET"])
@require_auth
def unread_count():
    """
    Count the signed-in member's unread notifications from the last 30 days

    Returns:
        {"count": number}
    """
    return _notification_controller.unread_count(g.token), 200


@notifications_bp.route("/<notification_id>", methods=["GET"])
def get_notification(notification_id):
    """
    Get specific notification

    Parameters:
        notification_id (str): Notification OHID

    Returns:
        Notification object
    """
    abort(501)


@notifications_bp.route("/<int:notification_id>/mark-read", methods=["POST"])
@require_auth
def mark_notification_read(notification_id):
    """
    Mark one of the signed-in member's notifications as read

    Parameters:
        notification_id (int): Notification OHID

    Returns:
        Updated notification object; 404 if it is not the member's
    """
    notification = _notification_controller.mark_read(g.token, notification_id)
    if notification is None:
        abort(404)
    return notification, 200


@notifications_bp.route("/mark-all-read", methods=["POST"])
@require_auth
def mark_all_read():
    """
    Mark all of the signed-in member's notifications as read

    Returns:
        {"count": number of notifications marked}
    """
    return _notification_controller.mark_all_read(g.token), 200
