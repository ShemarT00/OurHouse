"""
Members Routes
API endpoints for household member management and invitations
"""

from flask import request, jsonify
from members import members_bp
from auth.decorators import require_auth
from datetime import datetime
import uuid


@members_bp.route("/households/<household_id>/members", methods=["GET"])
@require_auth
def list_household_members(household_id):
    """
    Get all members of a household
    
    Parameters:
        household_id (str): Household OHID
    
    Returns:
        List of member objects in the household
    """
    try:
        # TODO: Verify user is member of this household
        # TODO: Query all members of this household
        # TODO: Return list of members with user details
        
        return jsonify({"message": f"List members of household {household_id}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@members_bp.route("/households/<household_id>/members/<member_id>", methods=["GET"])
@require_auth
def get_household_member(household_id, member_id):
    """
    Get specific member of a household
    
    Parameters:
        household_id (str): Household OHID
        member_id (str): Member OHID
    
    Returns:
        Member object with user details
    """
    try:
        # Verify user is member of this household
        # TODO: Query database to verify membership
        
        # Query specific member
        # TODO: Query database for member
        member = {}
        
        if not member:
            return jsonify({"error": "Member not found"}), 404
        
        # Return member data
        return jsonify({"member": member}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@members_bp.route("/households/<household_id>/members/invite", methods=["POST"])
@require_auth
def invite_member(household_id):
    """
    Invite a user to join household via email
    
    Parameters:
        household_id (str): Household OHID
    
    Request body:
        - email (str): Email address to invite
    
    Returns:
        Invite record with invite ID
    """
    try:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"error": "Unauthorized"}), 401
        
        data = request.get_json()
        
        if not data or "email" not in data:
            return jsonify({"error": "Missing required field: email"}), 400
        
        email = data.get("email").lower().strip()
        
        # Verify user is admin of this household
        # TODO: Query database to verify admin status
        
        # Check if email is already a member
        # TODO: Query database to check if user exists and is member
        
        # Create invite record
        invite_id = str(uuid.uuid4())
        # TODO: Insert invite into database
        
        # Send invitation email
        # TODO: Send email via mail service
        
        # Return invite details with invite ID
        return jsonify({"invite_id": invite_id, "email": email, "created_at": datetime.utcnow().isoformat()}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@members_bp.route("/households/<household_id>/members/<member_id>", methods=["DELETE"])
@require_auth
def remove_member(household_id, member_id):
    """
    Remove member from household
    
    Parameters:
        household_id (str): Household OHID
        member_id (str): Member OHID to remove
    
    Returns:
        Success message
    """
    try:
        # Verify user is admin of this household
        # TODO: Query database to verify admin status
        
        # Verify not deleting the last admin
        # TODO: Query database to count admins
        
        # Remove member from household
        # TODO: Delete member record from database
        
        # Optionally archive their list items
        # TODO: Archive list items for removed member
        
        return jsonify({"message": f"Member {member_id} removed from household {household_id}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@members_bp.route("/members/invites", methods=["GET"])
@require_auth
def get_pending_invites():
    """
    Get all pending invitations for current user
    
    Query parameters:
        - status (str, optional): Filter by status (pending, accepted, declined)
    
    Returns:
        List of household invitations
    """
    try:
        status = request.args.get("status", "pending").lower()
        valid_statuses = ["pending", "accepted", "declined"]
        
        if status not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        
        # Query all invites for this user
        # TODO: Query database for invites where user_id matches
        invites = []
        
        # Filter by status if provided
        # TODO: Filter results from database
        
        # Include household details in response
        # TODO: Join with household table to include details
        
        return jsonify({"invites": invites, "status_filter": status}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@members_bp.route("/members/invites/<invite_id>/accept", methods=["POST"])
@require_auth
def accept_invite(invite_id):
    """
    Accept a household invitation
    
    Parameters:
        invite_id (str): Invite OHID
    
    Returns:
        New member object
    """
    try:
        # Get invite from database
        # TODO: Query database for invite
        invite = {}
        
        if not invite:
            return jsonify({"error": "Invite not found"}), 404
        
        # Verify invite belongs to this user
        # TODO: Check if invite.user_id matches current_user
        
        if invite.get("status") != "pending":
            return jsonify({"error": f"Invite is already {invite.get('status')}"}), 400
        
        # Create member record
        member_id = str(uuid.uuid4())
        # TODO: Insert member into database
        
        # Mark invite as accepted
        # TODO: Update invite status to accepted in database
        
        # Return new member data
        member_data = {"member_id": member_id, "household_id": invite.get("household_id"), "created_at": datetime.utcnow().isoformat()}
        return jsonify({"member": member_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@members_bp.route("/members/invites/<invite_id>/decline", methods=["POST"])
@require_auth
def decline_invite(invite_id):
    """
    Decline a household invitation
    
    Parameters:
        invite_id (str): Invite OHID
    
    Returns:
        Success message
    """
    try:
        # Get invite from database
        # TODO: Query database for invite
        invite = {}
        
        if not invite:
            return jsonify({"error": "Invite not found"}), 404
        
        # Verify invite belongs to this user
        # TODO: Check if invite.user_id matches current_user
        
        if invite.get("status") != "pending":
            return jsonify({"error": f"Invite is already {invite.get('status')}"}), 400
        
        # Mark invite as declined
        # TODO: Update invite status to declined in database
        
        # Optionally delete invite record
        # TODO: Option to hard delete or soft delete
        
        return jsonify({"message": f"Invitation {invite_id} declined"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
