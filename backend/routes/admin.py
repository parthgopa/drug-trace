from flask import Blueprint, request, jsonify
from models.drug import Drug
from models.scan_log import ScanLog
from models.report import Report
from models.user import User
from utils.auth import token_required, role_required
from utils.helpers import serialize_doc

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/reports', methods=['GET'])
@token_required
@role_required('admin')
def get_all_reports():
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
def update_report_status(report_id):
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
def get_all_drugs():
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
def get_all_scans():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        skip = (page - 1) * limit
        
        scans = ScanLog.get_all(skip=skip, limit=limit)
        
        return jsonify({
            'success': True,
            'scans': serialize_doc(scans)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@admin_bp.route('/stats', methods=['GET'])
@token_required
@role_required('admin')
def get_system_stats():
    try:
        scan_stats = ScanLog.get_statistics()
        
        pending_reports = Report.count_by_status('pending')
        resolved_reports = Report.count_by_status('resolved')
        
        return jsonify({
            'success': True,
            'stats': {
                'scans': scan_stats,
                'reports': {
                    'pending': pending_reports,
                    'resolved': resolved_reports,
                    'total': pending_reports + resolved_reports
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
