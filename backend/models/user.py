from datetime import datetime
from bson import ObjectId
from utils.database import get_database
from utils.auth import hash_password, verify_password

class User:
    collection_name = 'users'

    @staticmethod
    def create(name: str, email: str, password: str, role: str, 
               company_name: str = None, license_number: str = None, address: str = None):
        db = get_database()
        
        existing_user = db[User.collection_name].find_one({'email': email})
        if existing_user:
            raise ValueError('Email already registered')
        
        user_data = {
            'name': name,
            'email': email,
            'password_hash': hash_password(password),
            'role': role,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        if role == 'manufacturer':
            user_data['company_name'] = company_name
            user_data['license_number'] = license_number
            user_data['address'] = address
        
        result = db[User.collection_name].insert_one(user_data)
        user_data['_id'] = result.inserted_id
        
        return user_data

    @staticmethod
    def find_by_email(email: str):
        db = get_database()
        return db[User.collection_name].find_one({'email': email})

    @staticmethod
    def find_by_id(user_id: str):
        db = get_database()
        return db[User.collection_name].find_one({'_id': ObjectId(user_id)})

    @staticmethod
    def authenticate(email: str, password: str):
        user = User.find_by_email(email)
        if not user:
            return None
        
        if verify_password(password, user['password_hash']):
            return user
        
        return None

    @staticmethod
    def update(user_id: str, update_data: dict):
        db = get_database()
        update_data['updated_at'] = datetime.utcnow()
        
        result = db[User.collection_name].update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        
        return result.modified_count > 0
