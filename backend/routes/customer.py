from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.drug import Drug
from models.scan_log import ScanLog
from models.report import Report
from models.scan_location import ScanLocation
from utils.auth import token_required, role_required
from utils.validators import ReportSubmission
from utils.helpers import serialize_doc, check_drug_status

customer_bp = Blueprint('customer', __name__, url_prefix='/customer')

@customer_bp.route('/verify/<serial_number>', methods=['GET'])
@token_required
def verify_drug(current_user, serial_number):
    try:
        user_id = request.current_user['user_id']
        
        drug = Drug.find_by_serial(serial_number)
        
        if not drug:
            scan_result = {
                'is_genuine': False,
                'status': 'fake',
                'message': '❌ FAKE - Serial number not found in database',
                'color': 'red'
            }
            
            ScanLog.create(
                user_id=user_id,
                serial_number=serial_number,
                scan_result=scan_result,
                drug_info=None
            )
            
            return jsonify({
                'success': True,
                'result': scan_result,
                'drug': None
            }), 200
        
        scan_result = check_drug_status(drug)
        
        drug_info_for_log = serialize_doc(drug)
        drug_info_for_response = serialize_doc(drug)
        drug_info_for_response.pop('manufacturer_id', None)
        
        ScanLog.create(
            user_id=user_id,
            serial_number=serial_number,
            scan_result=scan_result,
            drug_info=drug_info_for_log
        )
        
        return jsonify({
            'success': True,
            'result': scan_result,
            'drug': drug_info_for_response
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/history', methods=['GET'])
@token_required
@role_required('customer', 'manufacturer', 'admin')
def get_scan_history(current_user):
    try:
        user_id = request.current_user['user_id']
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        scans = ScanLog.find_by_user(user_id, skip=skip, limit=limit)
        total = ScanLog.count_by_user(user_id)
        
        return jsonify({
            'success': True,
            'history': serialize_doc(scans),
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

@customer_bp.route('/report', methods=['POST'])
@token_required
@role_required('customer', 'manufacturer', 'admin')
def submit_report(current_user):
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        validated_data = ReportSubmission(**data)
        
        report = Report.create(
            user_id=user_id,
            serial_number=validated_data.serial_number,
            issue_description=validated_data.issue_description,
            issue_type=validated_data.issue_type
        )
        
        return jsonify({
            'success': True,
            'message': 'Report submitted successfully',
            'report': serialize_doc(report)
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
            'error': 'Report submission failed',
            'details': str(e)
        }), 500

@customer_bp.route('/reports', methods=['GET'])
@token_required
@role_required('customer', 'manufacturer', 'admin')
def get_user_reports(current_user):
    try:
        user_id = request.current_user['user_id']
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        reports = Report.find_by_user(user_id, skip=skip, limit=limit)
        
        return jsonify({
            'success': True,
            'reports': serialize_doc(reports)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@customer_bp.route('/product/journey/<serial_number>', methods=['GET'])
@token_required
@role_required('customer', 'manufacturer', 'admin')
def get_product_journey(current_user, serial_number):
    try:
        # Get product journey/history
        journey = ScanLocation.get_product_journey(serial_number)
        
        # Get drug information
        drug = Drug.find_by_serial(serial_number)
        
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        drug_info = serialize_doc(drug)
        # Remove manufacturer_id for customers
        if request.current_user['role'] == 'customer':
            drug_info.pop('manufacturer_id', None)
        
        return jsonify({
            'success': True,
            'drug': drug_info,
            'journey': journey,
            'total_scans': len(journey)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
