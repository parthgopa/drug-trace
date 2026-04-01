from flask import Blueprint, request, jsonify
from models.user import User
from models.invitation import Invitation
from utils.auth import token_required, role_required
from utils.email_service import email_service
from pydantic import BaseModel, EmailStr, ValidationError
from typing import Optional

distributor_bp = Blueprint('distributor', __name__, url_prefix='/distributor')

class InviteRetailerRequest(BaseModel):
    email: EmailStr
    company_name: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "retailer@example.com",
                "company_name": "ABC Pharmacy"
            }
        }

@distributor_bp.route('/invite-retailer', methods=['POST'])
@token_required
@role_required('distributor')
def invite_retailer(current_user):
    """
    Distributor sends invitation to a retailer
    
    Workflow:
    1. Distributor provides email + optional company name
    2. System creates invitation record with role='retailer'
    3. Email sent to retailer
    4. Retailer can login with email, system detects invitation
    5. Retailer sets password, account created
    """
    try:
        data = request.get_json()
        validated_data = InviteRetailerRequest(**data)
        
        # Check if user already exists
        existing_user = User.find_by_email(validated_data.email)
        if existing_user:
            return jsonify({
                'success': False,
                'error': 'User with this email already exists'
            }), 400
        
        # Check if invitation already exists
        existing_invitation = Invitation.find_by_email(validated_data.email)
        if existing_invitation and existing_invitation['status'] == 'pending':
            return jsonify({
                'success': False,
                'error': 'Invitation already sent to this email'
            }), 400
        
        # Create invitation with role='retailer'
        invitation = Invitation.create(
            email=validated_data.email,
            role='retailer',
            invited_by=current_user['user_id'],
            company_name=validated_data.company_name
        )
        
        # Send invitation email
        distributor_user = User.find_by_id(current_user['user_id'])
        distributor_name = distributor_user.get('name', current_user.get('email', 'Distributor'))
        
        email_sent = email_service.send_invitation_email(
            to_email=validated_data.email,
            role='retailer',
            invited_by_name=distributor_name,
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
            },
            'email_sent': email_sent
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

@distributor_bp.route('/invitations', methods=['GET'])
@token_required
@role_required('distributor')
def get_invitations(current_user):
    """
    Get all invitations sent by this distributor
    """
    try:
        user_id = current_user['user_id']
        
        # Get invitations sent by this distributor
        invitations = Invitation.find_by_inviter(user_id)
        
        # Format response
        formatted_invitations = []
        for inv in invitations:
            formatted_invitations.append({
                '_id': inv['_id'],
                'email': inv['email'],
                'role': inv['role'],
                'status': inv['status'],
                'company_name': inv.get('company_name'),
                'created_at': inv['created_at'].isoformat(),
                'accepted_at': inv['accepted_at'].isoformat() if inv.get('accepted_at') else None
            })
        
        return jsonify({
            'success': True,
            'invitations': formatted_invitations,
            'total': len(formatted_invitations)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch invitations',
            'details': str(e)
        }), 500

@distributor_bp.route('/invitations/<invitation_id>', methods=['DELETE'])
@token_required
@role_required('distributor')
def delete_invitation(current_user, invitation_id):
    """
    Delete/cancel an invitation sent by this distributor
    """
    try:
        user_id = current_user['user_id']
        
        # Verify the invitation belongs to this distributor
        invitation = Invitation.find_by_id(invitation_id)
        if not invitation:
            return jsonify({
                'success': False,
                'error': 'Invitation not found'
            }), 404
        
        if invitation['invited_by'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized to delete this invitation'
            }), 403
        
        # Delete the invitation
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
