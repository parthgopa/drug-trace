from flask import Blueprint, request, jsonify
from models.drug import Drug
from models.scan_log import ScanLog
from models.report import Report
from models.user import User
from models.invitation import Invitation
from models.scan_location import ScanLocation
from utils.auth import token_required, role_required
from utils.helpers import serialize_doc
from utils.validators import UserRegistration
from pydantic import ValidationError
import bcrypt
from datetime import datetime

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/reports', methods=['GET'])
@token_required
@role_required('admin')
def get_all_reports(current_user):
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        skip = (page - 1) * limit
        
        reports = Report.get_all(skip=skip, limit=limit)
        total = Report.count_by_status()
        
        return jsonify({
            'success': True,
            'reports': serialize_doc(reports),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/report/<report_id>/status', methods=['PUT'])
@token_required
@role_required('admin')
def update_report_status(current_user, report_id):
    try:
        data = request.get_json()
        status = data.get('status')
        admin_notes = data.get('admin_notes')
        
        if not status:
            return jsonify({
                'success': False,
                'error': 'Status is required'
            }), 400
        
        success = Report.update_status(report_id, status, admin_notes)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Report not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Report status updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/drugs', methods=['GET'])
@token_required
@role_required('admin')
def get_all_drugs(current_user):
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        drugs = Drug.get_all(skip=skip, limit=limit)
        
        return jsonify({
            'success': True,
            'drugs': serialize_doc(drugs)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/scans', methods=['GET'])
@token_required
@role_required('admin')
def get_all_scans(current_user):
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        skip = (page - 1) * limit
        
        scans = ScanLog.get_all(skip=skip, limit=limit)
        total = ScanLog.count_all()
        
        return jsonify({
            'success': True,
            'scans': serialize_doc(scans),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/stats', methods=['GET'])
@token_required
@role_required('admin')
def get_system_stats(current_user):
    try:
        from utils.database import get_database
        db = get_database()
        
        # Get scan stats
        try:
            scan_stats = ScanLog.get_statistics()
        except Exception as e:
            print(f"Error getting scan stats: {e}")
            scan_stats = {'total': 0, 'genuine': 0, 'fake': 0}
        
        # Get report stats
        try:
            pending_reports = Report.count_by_status('pending')
            resolved_reports = Report.count_by_status('resolved')
        except Exception as e:
            print(f"Error getting report stats: {e}")
            pending_reports = 0
            resolved_reports = 0
        
        # Get user counts by role - using direct DB queries
        try:
            total_users = db.users.count_documents({})
            owners_count = db.users.count_documents({'role': 'owner'})
            manufacturers_count = db.users.count_documents({'role': 'manufacturer'})
            distributors_count = db.users.count_documents({'role': 'distributor'})
            retailers_count = db.users.count_documents({'role': 'retailer'})
            customers_count = db.users.count_documents({'role': 'customer'})
        except Exception as e:
            print(f"Error getting user stats: {e}")
            total_users = owners_count = manufacturers_count = distributors_count = retailers_count = customers_count = 0
        
        # Get drug stats - using direct DB queries
        try:
            total_drugs = db.drugs.count_documents({})
            active_drugs = db.drugs.count_documents({'status': 'active'})
        except Exception as e:
            print(f"Error getting drug stats: {e}")
            total_drugs = 0
            active_drugs = 0
        
        # Get invitation stats
        try:
            invitation_stats = Invitation.get_statistics()
        except Exception as e:
            print(f"Error getting invitation stats: {e}")
            invitation_stats = {'total': 0, 'pending': 0, 'accepted': 0}
        
        return jsonify({
            'success': True,
            'stats': {
                'users': {
                    'total': total_users,
                    'owners': owners_count,
                    'manufacturers': manufacturers_count,
                    'distributors': distributors_count,
                    'retailers': retailers_count,
                    'customers': customers_count
                },
                'drugs': {
                    'total': total_drugs,
                    'active': active_drugs
                },
                'scans': scan_stats,
                'reports': {
                    'pending': pending_reports,
                    'resolved': resolved_reports,
                    'total': pending_reports + resolved_reports
                },
                'invitations': invitation_stats
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_system_stats: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== USER MANAGEMENT ====================

@admin_bp.route('/users', methods=['GET'])
@token_required
@role_required('admin')
def get_all_users(current_user):
    """
    Get all users - frontend will filter by role
    """
    try:
        # Fetch all users at once, let frontend handle filtering
        result = User.get_all_users(page=1, limit=10000, exclude_customers=False)
        
        return jsonify({
            'success': True,
            'users': result['users'],
            'pagination': {
                'page': 1,
                'limit': result['total'],
                'total': result['total'],
                'pages': 1
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_all_users: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@token_required
@role_required('admin')
def get_user_details(current_user, user_id):
    """
    Get detailed information about a specific user
    """
    try:
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        # Get additional stats based on role
        additional_data = {}
        
        if user['role'] == 'manufacturer':
            # Get drugs created by this manufacturer
            drugs = Drug.find_by_manufacturer(user_id)
            additional_data['drugs_count'] = len(drugs)
            additional_data['recent_drugs'] = serialize_doc(drugs[:5])
        
        if user['role'] == 'customer':
            # Get scan history
            scans = ScanLog.find_by_user(user_id, limit=10)
            additional_data['scans_count'] = ScanLog.count_by_user(user_id)
            additional_data['recent_scans'] = serialize_doc(scans)
        
        if user['role'] in ['owner', 'distributor']:
            # Get invitations sent by this user
            invitations = Invitation.find_by_inviter(user_id)
            additional_data['invitations_count'] = len(invitations)
            additional_data['recent_invitations'] = serialize_doc(invitations[:5])
        
        return jsonify({
            'success': True,
            'user': serialize_doc(user),
            'additional_data': additional_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/users/<user_id>/activate', methods=['PATCH'])
@token_required
@role_required('admin')
def activate_user(current_user, user_id):
    """
    Activate a user account
    """
    try:
        success = User.activate(user_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'User activated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/users/<user_id>/deactivate', methods=['PATCH'])
@token_required
@role_required('admin')
def deactivate_user(current_user, user_id):
    """
    Deactivate a user account
    """
    try:
        success = User.deactivate(user_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'User deactivated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_user(current_user, user_id):
    """
    Delete a user account
    """
    try:
        success = User.delete(user_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/users/create-owner', methods=['POST'])
@token_required
@role_required('admin')
def create_owner(current_user):
    """
    Admin can create owner accounts directly
    """
    try:
        data = request.get_json()
        
        # Validate input
        user_data = UserRegistration(
            name=data.get('name'),
            email=data.get('email'),
            password=data.get('password'),
            role='owner',
            company_name=data.get('company_name')
        )
        
        # Check if user already exists
        existing_user = User.find_by_email(user_data.email)
        if existing_user:
            return jsonify({
                'success': False,
                'error': 'User with this email already exists'
            }), 400
        
        # Hash password
        password_hash = bcrypt.hashpw(
            user_data.password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        
        # Create owner
        user = User.create(
            name=user_data.name,
            email=user_data.email,
            password_hash=password_hash,
            role='owner',
            company_name=user_data.company_name
        )
        
        return jsonify({
            'success': True,
            'message': 'Owner created successfully',
            'user': serialize_doc(user)
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'details': e.errors()
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== CUSTOMER MANAGEMENT ====================

@admin_bp.route('/customers', methods=['GET'])
@token_required
@role_required('admin')
def get_all_customers(current_user):
    """
    Get all customers with their scan statistics
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        customers = User.find_by_role('customer', skip=skip, limit=limit)
        total = User.count_by_role('customer')
        
        # Enhance with scan counts
        for customer in customers:
            customer['scan_count'] = ScanLog.count_by_user(customer['_id'])
        
        return jsonify({
            'success': True,
            'customers': serialize_doc(customers),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/customers/<customer_id>/scans', methods=['GET'])
@token_required
@role_required('admin')
def get_customer_scans(current_user, customer_id):
    """
    Get all scans by a specific customer
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        scans = ScanLog.find_by_user(customer_id, skip=skip, limit=limit)
        total = ScanLog.count_by_user(customer_id)
        
        return jsonify({
            'success': True,
            'scans': serialize_doc(scans),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== DRUG MANAGEMENT ====================

@admin_bp.route('/drugs/<drug_id>', methods=['GET'])
@token_required
@role_required('admin')
def get_drug_details(current_user, drug_id):
    """
    Get detailed information about a specific drug
    """
    try:
        drug = Drug.find_by_id(drug_id)
        
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Drug not found'
            }), 404
        
        # Get scan locations for this drug
        scan_locations = ScanLocation.find_by_serial(drug['serial_number'])
        
        return jsonify({
            'success': True,
            'drug': serialize_doc(drug),
            'journey': serialize_doc(scan_locations)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/drugs/<drug_id>', methods=['PATCH'])
@token_required
@role_required('admin')
def update_drug(current_user, drug_id):
    """
    Update drug information
    """
    try:
        data = request.get_json()
        
        drug = Drug.find_by_id(drug_id)
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Drug not found'
            }), 404
        
        # Update allowed fields
        update_fields = {}
        if 'drug_name' in data:
            update_fields['drug_name'] = data['drug_name']
        if 'description' in data:
            update_fields['description'] = data['description']
        if 'status' in data:
            update_fields['status'] = data['status']
        if 'expiry_date' in data:
            update_fields['expiry_date'] = data['expiry_date']
        
        if update_fields:
            update_fields['updated_at'] = datetime.utcnow()
            success = Drug.update(drug_id, update_fields)
            
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Drug updated successfully'
                }), 200
        
        return jsonify({
            'success': False,
            'error': 'No valid fields to update'
        }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/drugs/<drug_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_drug(current_user, drug_id):
    """
    Delete a drug from the system
    """
    try:
        success = Drug.delete(drug_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Drug not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Drug deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== REPORT MANAGEMENT ====================

@admin_bp.route('/reports/<report_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_report(current_user, report_id):
    """
    Delete a report
    """
    try:
        success = Report.delete(report_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Report not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Report deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== INVITATION MANAGEMENT ====================

@admin_bp.route('/invitations', methods=['GET'])
@token_required
@role_required('admin')
def get_all_invitations(current_user):
    """
    Get all invitations in the system
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        status = request.args.get('status')
        
        result = Invitation.get_all_invitations(page=page, limit=limit)
        
        # Filter by status if provided
        if status:
            result['invitations'] = [inv for inv in result['invitations'] if inv['status'] == status]
        
        return jsonify({
            'success': True,
            'invitations': result['invitations'],
            'pagination': {
                'page': result['page'],
                'limit': result['limit'],
                'total': result['total'],
                'pages': result['total_pages']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/invitations/<invitation_id>', methods=['DELETE'])
@token_required
@role_required('admin')
def delete_invitation(current_user, invitation_id):
    """
    Delete an invitation
    """
    try:
        success = Invitation.delete_invitation(invitation_id)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'Invitation not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Invitation deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== OWNERS AND THEIR USERS ====================

@admin_bp.route('/owners', methods=['GET'])
@token_required
@role_required('admin')
def get_all_owners(current_user):
    """
    Get all owners with their created users count
    """
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        owners = User.find_by_role('owner', skip=skip, limit=limit)
        total = User.count_by_role('owner')
        
        # Enhance with created users count
        for owner in owners:
            invitations = Invitation.find_by_inviter(owner['_id'])
            owner['invitations_sent'] = len(invitations)
            owner['users_created'] = len([inv for inv in invitations if inv['status'] == 'accepted'])
        
        return jsonify({
            'success': True,
            'owners': serialize_doc(owners),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/owners/<owner_id>/users', methods=['GET'])
@token_required
@role_required('admin')
def get_owner_created_users(current_user, owner_id):
    """
    Get all users created by a specific owner (manufacturers, distributors, retailers)
    """
    try:
        # Get accepted invitations sent by this owner
        invitations = Invitation.find_by_inviter(owner_id, status='accepted')
        
        # Get user details for each accepted invitation
        users = []
        for invitation in invitations:
            user = User.find_by_email(invitation['email'])
            if user:
                users.append(user)
        
        return jsonify({
            'success': True,
            'users': serialize_doc(users),
            'total': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
