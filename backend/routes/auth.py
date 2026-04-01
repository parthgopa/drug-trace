from flask import Blueprint, request, jsonify
from pydantic import ValidationError, BaseModel, EmailStr
from models.user import User
from models.invitation import Invitation
from utils.auth import generate_token, token_required
from utils.validators import UserRegistration, UserLogin
from utils.helpers import serialize_doc
from typing import Optional

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        validated_data = UserRegistration(**data)
        
        user = User.create(
            name=validated_data.name,
            email=validated_data.email,
            password=validated_data.password,
            role=validated_data.role,
            company_name=validated_data.company_name,
            license_number=validated_data.license_number,
            address=validated_data.address
        )
        
        token = generate_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        user_response = serialize_doc(user)
        user_response.pop('password_hash', None)
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'token': token,
            'user': user_response,
            'role': user['role']
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
            'error': 'Registration failed',
            'details': str(e)
        }), 500

@auth_bp.route('/check-invitation', methods=['POST'])
def check_invitation():
    """
    Check if an email has a pending invitation
    
    Workflow:
    1. User enters email on login screen
    2. Frontend calls this endpoint
    3. If invitation exists, redirect to password setup
    4. If user exists, proceed to normal login
    5. If neither, show error
    """
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email is required'
            }), 400
        
        # Check if user already exists
        existing_user = User.find_by_email(email)
        if existing_user:
            return jsonify({
                'success': True,
                'has_account': True,
                'has_invitation': False,
                'message': 'User exists, proceed to login'
            }), 200
        
        # Check for pending invitation
        invitation = Invitation.find_by_email(email)
        if invitation:
            return jsonify({
                'success': True,
                'has_account': False,
                'has_invitation': True,
                'invitation': {
                    '_id': invitation['_id'],
                    'email': invitation['email'],
                    'role': invitation['role'],
                    'company_name': invitation.get('company_name')
                },
                'message': 'Invitation found, proceed to password setup'
            }), 200
        
        # Neither exists
        return jsonify({
            'success': False,
            'has_account': False,
            'has_invitation': False,
            'error': 'No account or invitation found for this email'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to check invitation',
            'details': str(e)
        }), 500

class PasswordSetupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_name: Optional[str] = None
    license_number: Optional[str] = None
    address: Optional[str] = None

@auth_bp.route('/setup-password', methods=['POST'])
def setup_password():
    """
    Setup password for invited user and create account
    
    Workflow:
    1. User has pending invitation
    2. User provides password and additional info
    3. Create user account with invited role
    4. Mark invitation as accepted
    5. Return token for auto-login
    """
    try:
        data = request.get_json()
        validated_data = PasswordSetupRequest(**data)
        
        # Check for pending invitation
        invitation = Invitation.find_by_email(validated_data.email)
        if not invitation:
            return jsonify({
                'success': False,
                'error': 'No pending invitation found for this email'
            }), 404
        
        # Check if user already exists
        existing_user = User.find_by_email(validated_data.email)
        if existing_user:
            return jsonify({
                'success': False,
                'error': 'User already exists with this email'
            }), 400
        
        # Create user with invited role
        user = User.create(
            name=validated_data.name,
            email=validated_data.email,
            password=validated_data.password,
            role=invitation['role'],
            company_name=validated_data.company_name or invitation.get('company_name'),
            license_number=validated_data.license_number,
            address=validated_data.address,
            invited_by=invitation['invited_by']
        )
        
        # Mark invitation as accepted
        Invitation.accept_invitation(validated_data.email)
        
        # Generate token for auto-login
        token = generate_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        user_response = serialize_doc(user)
        user_response.pop('password_hash', None)
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'token': token,
            'user': user_response,
            'role': user['role']
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
            'error': 'Failed to setup password',
            'details': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login with email and password
    
    Note: For invited users, they should first setup password via /setup-password
    """
    try:
        data = request.get_json()
        
        validated_data = UserLogin(**data)
        
        user = User.authenticate(validated_data.email, validated_data.password)
        # print(user)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        token = generate_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        user_response = serialize_doc(user)
        user_response.pop('password_hash', None)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': user_response,
            'role': user['role']
        }), 200
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'details': e.errors()
        }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Login failed',
            'details': str(e)
        }), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    try:
        user_id = request.current_user['user_id']
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        user_response = serialize_doc(user)
        user_response.pop('password_hash', None)
        
        return jsonify({
            'success': True,
            'user': user_response
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/verify-token', methods=['GET'])
@token_required
def verify_token():
    return jsonify({
        'success': True,
        'valid': True,
        'user': request.current_user
    }), 200
