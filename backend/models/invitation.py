from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId
from utils.database import get_database

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str  # 'manufacturer', 'distributor', 'retailer'
    invited_by: str  # Owner's user_id
    company_name: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "role": "manufacturer",
                "invited_by": "owner_user_id",
                "company_name": "ABC Pharma"
            }
        }

class Invitation:
    """
    Invitation Model for role-based user invitations
    
    Workflow:
    1. Owner sends invitation with email + role
    2. Invitation stored with status 'pending'
    3. User logs in with invited email
    4. System checks invitation, prompts password setup
    5. After password setup, invitation status → 'accepted'
    6. User created in users collection with assigned role
    """
    
    @staticmethod
    def create(email: str, role: str, invited_by: str, company_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new invitation
        
        Args:
            email: Email address to invite
            role: Role to assign ('manufacturer', 'distributor', 'retailer')
            invited_by: User ID of the owner sending invitation
            company_name: Optional company name
            
        Returns:
            Created invitation document
        """
        db = get_database()
        
        # Check if invitation already exists for this email
        existing = db.invitations.find_one({
            'email': email.lower(),
            'status': {'$in': ['pending', 'accepted']}
        })
        
        if existing:
            raise ValueError(f"Active invitation already exists for {email}")
        
        # Check if user already exists with this email
        existing_user = db.users.find_one({'email': email.lower()})
        if existing_user:
            raise ValueError(f"User already exists with email {email}")
        
        invitation = {
            'email': email.lower(),
            'role': role,
            'invited_by': invited_by,
            'company_name': company_name,
            'status': 'pending',  # pending, accepted, expired
            'created_at': datetime.utcnow(),
            'expires_at': None,  # Can add expiration logic later
            'accepted_at': None
        }
        
        result = db.invitations.insert_one(invitation)
        invitation['_id'] = str(result.inserted_id)
        
        return invitation
    
    @staticmethod
    def find_by_email(email: str) -> Optional[Dict[str, Any]]:
        """
        Find pending invitation by email
        
        Args:
            email: Email address
            
        Returns:
            Invitation document or None
        """
        db = get_database()
        invitation = db.invitations.find_one({
            'email': email.lower(),
            'status': 'pending'
        })
        
        if invitation:
            invitation['_id'] = str(invitation['_id'])
            
        return invitation
    
    @staticmethod
    def find_by_id(invitation_id: str) -> Optional[Dict[str, Any]]:
        """
        Find invitation by ID
        
        Args:
            invitation_id: Invitation ID
            
        Returns:
            Invitation document or None
        """
        db = get_database()
        
        try:
            invitation = db.invitations.find_one({'_id': ObjectId(invitation_id)})
            if invitation:
                invitation['_id'] = str(invitation['_id'])
            return invitation
        except:
            return None
    
    @staticmethod
    def accept_invitation(email: str) -> Dict[str, Any]:
        """
        Mark invitation as accepted
        
        Args:
            email: Email address
            
        Returns:
            Updated invitation document
        """
        db = get_database()
        
        result = db.invitations.find_one_and_update(
            {'email': email.lower(), 'status': 'pending'},
            {
                '$set': {
                    'status': 'accepted',
                    'accepted_at': datetime.utcnow()
                }
            },
            return_document=True
        )
        
        if result:
            result['_id'] = str(result['_id'])
            
        return result
    
    @staticmethod
    def get_invitations_by_owner(owner_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all invitations sent by an owner
        
        Args:
            owner_id: Owner's user ID
            status: Filter by status (optional)
            
        Returns:
            List of invitation documents
        """
        db = get_database()
        
        query = {'invited_by': owner_id}
        if status:
            query['status'] = status
        
        invitations = list(db.invitations.find(query).sort('created_at', -1))
        
        for inv in invitations:
            inv['_id'] = str(inv['_id'])
            
        return invitations
    
    @staticmethod
    def find_by_inviter(inviter_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all invitations sent by a specific user (owner or distributor)
        
        Args:
            inviter_id: User ID of the person who sent invitations
            status: Filter by status (optional)
            
        Returns:
            List of invitation documents
        """
        db = get_database()
        
        query = {'invited_by': inviter_id}
        if status:
            query['status'] = status
        
        invitations = list(db.invitations.find(query).sort('created_at', -1))
        
        for inv in invitations:
            inv['_id'] = str(inv['_id'])
            
        return invitations
    
    @staticmethod
    def get_all_invitations(page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Get all invitations with pagination
        
        Args:
            page: Page number
            limit: Items per page
            
        Returns:
            Dictionary with invitations and pagination info
        """
        db = get_database()
        
        skip = (page - 1) * limit
        
        invitations = list(
            db.invitations.find()
            .sort('created_at', -1)
            .skip(skip)
            .limit(limit)
        )
        
        total = db.invitations.count_documents({})
        
        for inv in invitations:
            inv['_id'] = str(inv['_id'])
        
        return {
            'invitations': invitations,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
    
    @staticmethod
    def delete_invitation(invitation_id: str) -> bool:
        """
        Delete an invitation
        
        Args:
            invitation_id: Invitation ID
            
        Returns:
            True if deleted, False otherwise
        """
        db = get_database()
        
        try:
            result = db.invitations.delete_one({'_id': ObjectId(invitation_id)})
            return result.deleted_count > 0
        except:
            return False
    
    @staticmethod
    def get_statistics() -> Dict[str, Any]:
        """
        Get invitation statistics
        
        Returns:
            Dictionary with statistics
        """
        db = get_database()
        
        total = db.invitations.count_documents({})
        pending = db.invitations.count_documents({'status': 'pending'})
        accepted = db.invitations.count_documents({'status': 'accepted'})
        
        # Count by role
        manufacturer_count = db.invitations.count_documents({'role': 'manufacturer'})
        distributor_count = db.invitations.count_documents({'role': 'distributor'})
        retailer_count = db.invitations.count_documents({'role': 'retailer'})
        
        return {
            'total': total,
            'pending': pending,
            'accepted': accepted,
            'by_role': {
                'manufacturer': manufacturer_count,
                'distributor': distributor_count,
                'retailer': retailer_count
            }
        }
