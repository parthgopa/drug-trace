from flask import Blueprint, request, jsonify
from models.user import User
from models.invitation import Invitation
from utils.auth import token_required, role_required
from utils.email_service import email_service
from pydantic import BaseModel, EmailStr, ValidationError
from typing import Optional

owner_bp = Blueprint('owner', __name__)

class InviteUserRequest(BaseModel):
    email: EmailStr
    role: str
    company_name: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "role": "manufacturer",
                "company_name": "ABC Pharma"
            }
        }

@owner_bp.route('/invite', methods=['POST'])
@token_required
@role_required('owner')
def invite_user(current_user):
    """
    Send invitation to a user with assigned role
    
    Workflow:
    1. Owner provides email + role
    2. System creates invitation record
    3. Email sent to user (placeholder for now)
    4. User can login with email, system detects invitation
    5. User sets password, account created
    """
    try:
        data = request.get_json()
        validated_data = InviteUserRequest(**data)
        
        # Validate role
        valid_roles = ['manufacturer', 'distributor', 'retailer']
        if validated_data.role not in valid_roles:
            return jsonify({
                'success': False,
                'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
            }), 400
        
        # Create invitation
        invitation = Invitation.create(
            email=validated_data.email,
            role=validated_data.role,
            invited_by=current_user['user_id'],
            company_name=validated_data.company_name
        )
        
        # Send invitation email
        owner_name = current_user.get('email', 'System Administrator')
        email_sent = email_service.send_invitation_email(
            to_email=validated_data.email,
            role=validated_data.role,
            invited_by_name=owner_name,
            company_name=validated_data.company_name
        )
        
        return jsonify({
            'success': True,
            'message': f'Invitation sent to {validated_data.email}',
            'invitation': {
                '_id': invitation['_id'],
                'email': invitation['email'],
                'role': invitation['role'],
                'status': invitation['status'],
                'created_at': invitation['created_at'].isoformat()
            }
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'details': e.errors()
        }), 400
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to send invitation',
            'details': str(e)
        }), 500

@owner_bp.route('/invitations', methods=['GET'])
@token_required
@role_required('owner')
def get_invitations(current_user):
    """
    Get all invitations sent by the owner
    """
    try:
        status = request.args.get('status')  # pending, accepted, expired
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        if status:
            invitations = Invitation.get_invitations_by_owner(
                current_user['user_id'],
                status=status
            )
            # Apply pagination manually
            start = (page - 1) * limit
            end = start + limit
            paginated = invitations[start:end]
            
            return jsonify({
                'success': True,
                'invitations': [{
                    '_id': inv['_id'],
                    'email': inv['email'],
                    'role': inv['role'],
                    'company_name': inv.get('company_name'),
                    'status': inv['status'],
                    'created_at': inv['created_at'].isoformat(),
                    'accepted_at': inv['accepted_at'].isoformat() if inv.get('accepted_at') else None
                } for inv in paginated],
                'total': len(invitations),
                'page': page,
                'limit': limit
            }), 200
        else:
            result = Invitation.get_all_invitations(page, limit)
            
            return jsonify({
                'success': True,
                'invitations': [{
                    '_id': inv['_id'],
                    'email': inv['email'],
                    'role': inv['role'],
                    'company_name': inv.get('company_name'),
                    'status': inv['status'],
                    'created_at': inv['created_at'].isoformat(),
                    'accepted_at': inv['accepted_at'].isoformat() if inv.get('accepted_at') else None
                } for inv in result['invitations']],
                'total': result['total'],
                'page': result['page'],
                'limit': result['limit'],
                'total_pages': result['total_pages']
            }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch invitations',
            'details': str(e)
        }), 500

@owner_bp.route('/invitations/<invitation_id>', methods=['DELETE'])
@token_required
@role_required('owner')
def delete_invitation(current_user, invitation_id):
    """
    Delete/cancel an invitation
    """
    try:
        # Verify invitation belongs to this owner
        invitation = Invitation.find_by_id(invitation_id)
        if not invitation:
            return jsonify({
                'success': False,
                'error': 'Invitation not found'
            }), 404
        
        if invitation['invited_by'] != current_user['user_id']:
            return jsonify({
                'success': False,
                'error': 'Unauthorized to delete this invitation'
            }), 403
        
        success = Invitation.delete_invitation(invitation_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Invitation deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete invitation'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to delete invitation',
            'details': str(e)
        }), 500

@owner_bp.route('/users', methods=['GET'])
@token_required
@role_required('owner')
def get_users(current_user):
    """
    Get all users (excluding customers)
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        role = request.args.get('role')
        
        if role:
            result = User.get_users_by_role(role, page, limit)
        else:
            result = User.get_all_users(page, limit, exclude_customers=True)
        
        return jsonify({
            'success': True,
            'users': result['users'],
            'total': result['total'],
            'page': result['page'],
            'limit': result['limit'],
            'total_pages': result['total_pages']
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch users',
            'details': str(e)
        }), 500

@owner_bp.route('/users/<user_id>/deactivate', methods=['POST'])
@token_required
@role_required('owner')
def deactivate_user(current_user, user_id):
    """
    Deactivate a user account
    """
    try:
        success = User.deactivate_user(user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'User deactivated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to deactivate user'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to deactivate user',
            'details': str(e)
        }), 500

@owner_bp.route('/users/<user_id>/activate', methods=['POST'])
@token_required
@role_required('owner')
def activate_user(current_user, user_id):
    """
    Activate a user account
    """
    try:
        success = User.activate_user(user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'User activated successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to activate user'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to activate user',
            'details': str(e)
        }), 500

@owner_bp.route('/statistics', methods=['GET'])
@token_required
@role_required('owner')
def get_statistics(current_user):
    """
    Get system statistics for owner dashboard
    """
    try:
        user_stats = User.get_statistics()
        invitation_stats = Invitation.get_statistics()
        
        return jsonify({
            'success': True,
            'statistics': {
                'users': user_stats,
                'invitations': invitation_stats
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch statistics',
            'details': str(e)
        }), 500
