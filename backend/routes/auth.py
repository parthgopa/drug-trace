from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.user import User
from utils.auth import generate_token, token_required
from utils.validators import UserRegistration, UserLogin
from utils.helpers import serialize_doc

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

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        validated_data = UserLogin(**data)
        
        user = User.authenticate(validated_data.email, validated_data.password)
        
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
