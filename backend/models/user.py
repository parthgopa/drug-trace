from datetime import datetime
from typing import Optional, Dict, Any, List
from bson import ObjectId
from utils.database import get_database
from utils.auth import hash_password, verify_password

class User:
    """
    User Model supporting role-based system
    
    Roles:
    - owner: Can invite and manage users
    - manufacturer: Uploads product & batch data, scans products
    - distributor: Tracks product movement, scans products
    - retailer: Verifies products, scans products
    - customer: Verifies product authenticity
    """
    collection_name = 'users'

    @staticmethod
    def create(name: str, email: str, password: str, role: str, 
               company_name: Optional[str] = None, 
               license_number: Optional[str] = None, 
               address: Optional[str] = None,
               invited_by: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new user
        
        Args:
            name: User's full name
            email: Email address (unique)
            password: Plain text password (will be hashed)
            role: User role (owner, manufacturer, distributor, retailer, customer)
            company_name: Company name (for business roles)
            license_number: License number (for manufacturer)
            address: Business address
            invited_by: User ID of the person who invited this user
            
        Returns:
            Created user document
        """
        db = get_database()
        
        # Check if email already exists
        existing_user = db[User.collection_name].find_one({'email': email.lower()})
        if existing_user:
            raise ValueError('Email already registered')
        
        user_data = {
            'name': name,
            'email': email.lower(),
            'password_hash': hash_password(password),
            'role': role,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'is_active': True
        }
        
        # Add role-specific fields
        if role in ['manufacturer', 'distributor', 'retailer']:
            user_data['company_name'] = company_name
            user_data['address'] = address
            
        if role == 'manufacturer':
            user_data['license_number'] = license_number
            
        if invited_by:
            user_data['invited_by'] = invited_by
        
        result = db[User.collection_name].insert_one(user_data)
        user_data['_id'] = result.inserted_id
        
        return user_data

    @staticmethod
    def find_by_email(email: str) -> Optional[Dict[str, Any]]:
        """
        Find user by email address
        
        Args:
            email: Email address
            
        Returns:
            User document or None
        """
        db = get_database()
        return db[User.collection_name].find_one({'email': email.lower()})

    @staticmethod
    def find_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Find user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            User document or None
        """
        db = get_database()
        try:
            return db[User.collection_name].find_one({'_id': ObjectId(user_id)})
        except:
            return None

    @staticmethod
    def authenticate(email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with email and password
        
        Args:
            email: Email address
            password: Plain text password
            
        Returns:
            User document if authenticated, None otherwise
        """
        user = User.find_by_email(email)
        if not user:
            return None
        
        if not user.get('is_active', True):
            return None
        
        if verify_password(password, user['password_hash']):
            return user
        
        return None

    @staticmethod
    def update(user_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update user data
        
        Args:
            user_id: User ID
            update_data: Dictionary of fields to update
            
        Returns:
            True if updated, False otherwise
        """
        db = get_database()
        update_data['updated_at'] = datetime.utcnow()
        
        try:
            result = db[User.collection_name].update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def get_users_by_role(role: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Get users by role with pagination
        
        Args:
            role: User role to filter
            page: Page number
            limit: Items per page
            
        Returns:
            Dictionary with users and pagination info
        """
        db = get_database()
        
        skip = (page - 1) * limit
        
        users = list(
            db[User.collection_name].find({'role': role})
            .sort('created_at', -1)
            .skip(skip)
            .limit(limit)
        )
        
        total = db[User.collection_name].count_documents({'role': role})
        
        # Remove password hashes from response
        for user in users:
            user['_id'] = str(user['_id'])
            user.pop('password_hash', None)
        
        return {
            'users': users,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
    
    @staticmethod
    def get_all_users(page: int = 1, limit: int = 20, exclude_customers: bool = False) -> Dict[str, Any]:
        """
        Get all users with pagination
        
        Args:
            page: Page number
            limit: Items per page
            exclude_customers: If True, exclude customer role users
            
        Returns:
            Dictionary with users and pagination info
        """
        db = get_database()
        
        skip = (page - 1) * limit
        
        query = {}
        if exclude_customers:
            query['role'] = {'$ne': 'customer'}
        
        users = list(
            db[User.collection_name].find(query)
            .sort('created_at', -1)
            .skip(skip)
            .limit(limit)
        )
        
        total = db[User.collection_name].count_documents(query)
        
        # Remove password hashes from response
        for user in users:
            user['_id'] = str(user['_id'])
            user.pop('password_hash', None)
        
        return {
            'users': users,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
    
    @staticmethod
    def get_statistics() -> Dict[str, Any]:
        """
        Get user statistics by role
        
        Returns:
            Dictionary with user counts by role
        """
        db = get_database()
        
        total = db[User.collection_name].count_documents({})
        owners = db[User.collection_name].count_documents({'role': 'owner'})
        manufacturers = db[User.collection_name].count_documents({'role': 'manufacturer'})
        distributors = db[User.collection_name].count_documents({'role': 'distributor'})
        retailers = db[User.collection_name].count_documents({'role': 'retailer'})
        customers = db[User.collection_name].count_documents({'role': 'customer'})
        
        return {
            'total': total,
            'by_role': {
                'owner': owners,
                'manufacturer': manufacturers,
                'distributor': distributors,
                'retailer': retailers,
                'customer': customers
            }
        }
    
    @staticmethod
    def deactivate_user(user_id: str) -> bool:
        """
        Deactivate a user account
        
        Args:
            user_id: User ID
            
        Returns:
            True if deactivated, False otherwise
        """
        return User.update(user_id, {'is_active': False})
    
    @staticmethod
    def activate_user(user_id: str) -> bool:
        """
        Activate a user account
        
        Args:
            user_id: User ID
            
        Returns:
            True if activated, False otherwise
        """
        return User.update(user_id, {'is_active': True})
