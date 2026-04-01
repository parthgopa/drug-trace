from flask import Blueprint, request, jsonify, send_file
from pydantic import ValidationError
from bson import ObjectId
from models.drug import Drug
from models.user import User
from models.scan_log import ScanLog
from models.scan_location import ScanLocation
from models.report import Report
from utils.auth import token_required, role_required
from utils.validators import DrugRegistration, DrugRecall
from utils.helpers import serialize_doc, generate_qr_code
from utils.database import get_database
import io
import csv
import base64
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader

manufacturer_bp = Blueprint('manufacturer', __name__, url_prefix='/manufacturer')

@manufacturer_bp.route('/drug/generate', methods=['POST'])
@token_required
@role_required('manufacturer', 'admin')
def generate_drugs(current_user):
    try:
        print("=== Drug Generation Request ===")
        data = request.get_json()
        print(f"Request data: {data}")
        print(f"Current user: {request.current_user}")
        user_id = request.current_user['user_id']
        print(f"User ID: {user_id}")
        
        print("Finding user...")
        user = User.find_by_id(user_id)
        print(f"User found: {user}")
        manufacturer_name = user.get('company_name', user.get('name'))
        print(f"Manufacturer name: {manufacturer_name}")

        # Inject manufacturer name for validation (DrugRegistration requires it)
        if not data:
            data = {}
        data['manufacturer'] = manufacturer_name

        print("Validating data...")
        validated_data = DrugRegistration(**data)
        print(f"Validated: {validated_data}")
        
        print("Creating batch...")
        result = Drug.create_batch(
            drug_name=validated_data.drug_name,
            manufacturer=manufacturer_name,
            batch_number=validated_data.batch_number,
            quantity=validated_data.quantity,
            expiry_date=validated_data.expiry_date,
            manufacturing_date=validated_data.manufacturing_date,
            manufacturer_id=user_id,
            description=validated_data.description
        )
        print(f"Batch created: {result['batch_number']}, Quantity: {result['quantity']}")
        print(f"QR codes generated and saved: {len(result['qr_codes'])} codes")
        
        return jsonify({
            'success': True,
            'message': f'Successfully generated {result["quantity"]} drugs with QR codes',
            'batch_number': result['batch_number'],
            'quantity': result['quantity'],
            'serial_numbers': result['serial_numbers'],
            'qr_codes': result['qr_codes']
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'details': e.errors()
        }), 400
        
    except Exception as e:
        print(f"Error in generate_drugs: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Check for duplicate key error
        error_msg = str(e)
        if 'E11000' in error_msg or 'duplicate key' in error_msg:
            return jsonify({
                'success': False,
                'error': 'Duplicate batch number',
                'details': 'This batch number already exists. Please use a unique batch number.'
            }), 409
        
        return jsonify({
            'success': False,
            'error': 'Drug generation failed',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/drugs', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_manufacturer_drugs(current_user):
    try:
        user_id = request.current_user['user_id']
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        drugs = Drug.find_by_manufacturer(user_id, skip=skip, limit=limit)
        total = Drug.count_by_manufacturer(user_id)
        
        return jsonify({
            'success': True,
            'drugs': serialize_doc(drugs),
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

@manufacturer_bp.route('/batches', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_manufacturer_batches(current_user):
    try:
        user_id = request.current_user['user_id']
        
        batches = Drug.get_batches_by_manufacturer(user_id)
        
        return jsonify({
            'success': True,
            'batches': serialize_doc(batches)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@manufacturer_bp.route('/recall', methods=['POST'])
@token_required
@role_required('manufacturer', 'admin')
def recall_batch(current_user):
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        validated_data = DrugRecall(**data)
        
        count = Drug.recall_batch(validated_data.batch_number, user_id)
        
        if count == 0:
            return jsonify({
                'success': False,
                'error': 'Batch not found or already recalled'
            }), 404
        
        return jsonify({
            'success': True,
            'message': f'Successfully recalled {count} drugs from batch {validated_data.batch_number}',
            'recalled_count': count,
            'reason': validated_data.reason
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
            'error': 'Recall failed',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/batch/<batch_number>/qr-codes', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_batch_qr_codes(current_user, batch_number):
    try:
        user_id = request.current_user['user_id']
        
        # Get all drugs in the batch
        drugs = Drug.find_by_batch(batch_number)
        
        if not drugs:
            return jsonify({
                'success': False,
                'error': 'Batch not found'
            }), 404
        
        # Verify manufacturer owns this batch
        if drugs[0]['manufacturer_id'] != user_id and request.current_user['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Unauthorized access'
            }), 403
        
        # Extract QR codes
        qr_codes = []
        for drug in drugs:
            qr_codes.append({
                'serial_number': drug['serial_number'],
                'qr_code': drug.get('qr_code', '')
            })
        
        return jsonify({
            'success': True,
            'batch_number': batch_number,
            'quantity': len(qr_codes),
            'qr_codes': qr_codes
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve QR codes',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/batch/<batch_number>', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_batch_details(current_user, batch_number):
    try:
        user_id = request.current_user['user_id']
        
        drugs = Drug.find_by_batch(batch_number)
        
        if not drugs:
            return jsonify({
                'success': False,
                'error': 'Batch not found'
            }), 404
        
        if drugs[0]['manufacturer_id'] != user_id and request.current_user['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Access denied'
            }), 403
        
        return jsonify({
            'success': True,
            'batch_number': batch_number,
            'quantity': len(drugs),
            'drugs': serialize_doc(drugs)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@manufacturer_bp.route('/stats', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_manufacturer_stats(current_user):
    try:
        user_id = request.current_user['user_id']
        
        total_drugs = Drug.count_by_manufacturer(user_id)
        batches = Drug.get_batches_by_manufacturer(user_id)
        
        active_batches = sum(1 for b in batches if b.get('status') == 'active')
        recalled_batches = sum(1 for b in batches if b.get('status') == 'recalled')
        voided_batches = sum(1 for b in batches if b.get('status') == 'voided')
        
        scan_stats = ScanLog.get_manufacturer_statistics(user_id)
        
        recent_batches = batches[:5]
        
        return jsonify({
            'success': True,
            'stats': {
                'total_drugs': total_drugs,
                'total_batches': len(batches),
                'active_batches': active_batches,
                'recalled_batches': recalled_batches,
                'voided_batches': voided_batches,
                'total_scans': scan_stats['total_scans'],
                'genuine_scans': scan_stats['genuine_scans'],
                'fake_scans': scan_stats['fake_scans'],
                'suspicious_scans': scan_stats['suspicious_scans']
            },
            'recent_batches': serialize_doc(recent_batches)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@manufacturer_bp.route('/batch/<batch_number>/export', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def export_batch(current_user, batch_number):
    try:
        user_id = request.current_user['user_id']
        export_format = request.args.get('format', 'pdf').lower()
        
        drugs = Drug.find_by_batch(batch_number)
        
        if not drugs:
            return jsonify({
                'success': False,
                'error': 'Batch not found'
            }), 404
        
        if drugs[0]['manufacturer_id'] != user_id and request.current_user['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Unauthorized access'
            }), 403
        
        if export_format == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['Drug Name', 'Batch Number', 'Serial Number', 'Expiry Date', 'Manufacturing Date'])
            
            for drug in drugs:
                writer.writerow([
                    drug['drug_name'],
                    drug['batch_number'],
                    drug['serial_number'],
                    drug['expiry_date'],
                    drug['manufacturing_date']
                ])
            
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'batch_{batch_number}.csv'
            )
        
        elif export_format == 'pdf':
            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4
            
            c.setFont('Helvetica-Bold', 16)
            c.drawString(50, height - 50, f'Batch: {batch_number}')
            c.setFont('Helvetica', 10)
            c.drawString(50, height - 70, f'Drug: {drugs[0]["drug_name"]}')
            c.drawString(50, height - 85, f'Manufacturer: {drugs[0]["manufacturer"]}')
            c.drawString(50, height - 100, f'Quantity: {len(drugs)} units')
            c.drawString(50, height - 115, f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}')
            
            y_position = height - 150
            x_position = 50
            qr_size = 80
            items_per_row = 4
            items_per_page = 20
            item_count = 0
            
            for drug in drugs:
                if item_count > 0 and item_count % items_per_page == 0:
                    c.showPage()
                    y_position = height - 50
                    x_position = 50
                
                qr_data = drug['qr_code']
                if qr_data.startswith('data:image/png;base64,'):
                    qr_data = qr_data.replace('data:image/png;base64,', '')
                    img_data = base64.b64decode(qr_data)
                    img = ImageReader(io.BytesIO(img_data))
                    
                    c.drawImage(img, x_position, y_position - qr_size, width=qr_size, height=qr_size)
                    
                    c.setFont('Helvetica', 7)
                    serial_text = drug['serial_number'][:20]
                    c.drawString(x_position, y_position - qr_size - 10, serial_text)
                    
                    x_position += qr_size + 20
                    
                    if (item_count + 1) % items_per_row == 0:
                        x_position = 50
                        y_position -= qr_size + 40
                
                item_count += 1
            
            c.save()
            buffer.seek(0)
            
            return send_file(
                buffer,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'batch_{batch_number}_qrcodes.pdf'
            )
        
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid format. Use pdf or csv'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Export failed',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/batch/<batch_number>/void', methods=['POST'])
@token_required
@role_required('manufacturer', 'admin')
def void_batch(current_user, batch_number):
    try:
        user_id = request.current_user['user_id']
        
        count = Drug.void_batch(batch_number, user_id)
        
        if count == 0:
            return jsonify({
                'success': False,
                'error': 'Batch not found or already voided'
            }), 404
        
        return jsonify({
            'success': True,
            'message': f'Successfully voided {count} drugs from batch {batch_number}',
            'voided_count': count
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Void operation failed',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/batch/<batch_number>/duplicate', methods=['POST'])
@token_required
@role_required('manufacturer', 'admin')
def duplicate_batch(current_user, batch_number):
    try:
        user_id = request.current_user['user_id']
        data = request.get_json() or {}
        
        new_batch_number = data.get('new_batch_number')
        if not new_batch_number:
            return jsonify({
                'success': False,
                'error': 'new_batch_number is required'
            }), 400
        
        updates = {
            'drug_name': data.get('drug_name'),
            'expiry_date': data.get('expiry_date'),
            'manufacturing_date': data.get('manufacturing_date'),
            'description': data.get('description')
        }
        updates = {k: v for k, v in updates.items() if v is not None}
        
        result = Drug.duplicate_batch(batch_number, new_batch_number, user_id, updates)
        
        if not result:
            return jsonify({
                'success': False,
                'error': 'Batch not found or unauthorized'
            }), 404
        
        return jsonify({
            'success': True,
            'message': f'Successfully duplicated batch to {new_batch_number}',
            'new_batch_number': result['batch_number'],
            'quantity': result['quantity']
        }), 201
        
    except Exception as e:
        error_msg = str(e)
        if 'E11000' in error_msg or 'duplicate key' in error_msg:
            return jsonify({
                'success': False,
                'error': 'Duplicate batch number',
                'details': 'The new batch number already exists'
            }), 409
        
        return jsonify({
            'success': False,
            'error': 'Duplicate operation failed',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/batch/<batch_number>', methods=['DELETE'])
@token_required
@role_required('manufacturer', 'admin')
def soft_delete_batch(current_user, batch_number):
    try:
        user_id = request.current_user['user_id']
        
        count = Drug.soft_delete_batch(batch_number, user_id)
        
        if count == 0:
            return jsonify({
                'success': False,
                'error': 'Batch not found or already deleted'
            }), 404
        
        return jsonify({
            'success': True,
            'message': f'Successfully deleted {count} drugs from batch {batch_number}',
            'deleted_count': count
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Delete operation failed',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/scan/record', methods=['POST'])
@token_required
@role_required('manufacturer', 'admin')
def record_scan(current_user):
    try:
        user_id = request.current_user['user_id']
        print(user_id)
        data = request.get_json()
        
        serial_number = data.get('serial_number')
        scan_type = data.get('scan_type', 'distribution')  # manufacture, distribution, retail
        location = data.get('location', {})
        notes = data.get('notes', '')
        
        if not serial_number:
            return jsonify({
                'success': False,
                'error': 'Serial number is required'
            }), 400
        
        # Verify the drug exists and belongs to this manufacturer
        drug = Drug.find_by_serial(serial_number)
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        if drug['manufacturer_id'] != user_id and request.current_user['role'] != 'admin':
            return jsonify({
                'success': False,
                'error': 'Unauthorized access'
            }), 403
        
        # Record the scan location
        scan_location = ScanLocation.create(
            serial_number=serial_number,
            scanned_by_id=user_id,
            scanned_by_role='manufacturer',
            location=location,
            scan_type=scan_type,
            notes=notes
        )
        
        return jsonify({
            'success': True,
            'message': 'Scan recorded successfully',
            'scan_location': serialize_doc(scan_location)
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to record scan',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/analytics/scans', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_scan_analytics(current_user):
    try:
        user_id = request.current_user['user_id']
        
        # Get scan analytics
        analytics = ScanLocation.get_analytics_by_manufacturer(user_id)
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@manufacturer_bp.route('/scans/recent', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_recent_scans(current_user):
    try:
        user_id = request.current_user['user_id']
        limit = request.args.get('limit', 50, type=int)
        
        # Get recent scan locations
        scans = ScanLocation.get_by_manufacturer(user_id, limit=limit)
        
        return jsonify({
            'success': True,
            'scans': scans,
            'count': len(scans)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@manufacturer_bp.route('/reports', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_manufacturer_reports(current_user):
    """
    Optimized endpoint to get reports for drugs belonging to the manufacturer.
    Uses aggregation pipeline for efficient querying.
    """
    try:
        user_id = request.current_user['user_id']
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        status = request.args.get('status', None, type=str)
        
        skip = (page - 1) * limit
        
        # Use optimized method from Report model
        reports, total_count = Report.find_by_manufacturer(
            manufacturer_id=user_id,
            skip=skip,
            limit=limit,
            status=status
        )
        
        return jsonify({
            'success': True,
            'reports': serialize_doc(reports),
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit if total_count > 0 else 0
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch reports',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/reports/statistics', methods=['GET'])
@token_required
@role_required('manufacturer', 'admin')
def get_manufacturer_report_statistics(current_user):
    """
    Get report statistics for manufacturer.
    """
    try:
        user_id = request.current_user['user_id']
        
        stats = Report.get_statistics_by_manufacturer(user_id)
        
        return jsonify({
            'success': True,
            'statistics': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch report statistics',
            'details': str(e)
        }), 500

@manufacturer_bp.route('/reports/<report_id>/status', methods=['PUT'])
@token_required
@role_required('manufacturer', 'admin')
def update_report_status(current_user, report_id):
    """
    Update report status (resolve/reject).
    Manufacturers can update status of reports on their drugs.
    """
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()
        
        status = data.get('status')
        admin_notes = data.get('admin_notes', '')
        
        if status not in ['resolved', 'rejected', 'pending']:
            return jsonify({
                'success': False,
                'error': 'Invalid status. Must be pending, resolved, or rejected'
            }), 400
        
        # Verify the report exists and belongs to a drug owned by this manufacturer
        db = get_database()
        report = db[Report.collection_name].find_one({'_id': ObjectId(report_id)})
        
        if not report:
            return jsonify({
                'success': False,
                'error': 'Report not found'
            }), 404
        
        # Verify the drug belongs to this manufacturer
        drug = Drug.find_by_serial(report['serial_number'])
        if not drug or (drug.get('manufacturer_id') != user_id and request.current_user['role'] != 'admin'):
            return jsonify({
                'success': False,
                'error': 'Unauthorized access'
            }), 403
        
        # Update report status
        success = Report.update_status(report_id, status, admin_notes)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Report status updated to {status}',
                'report_id': report_id,
                'new_status': status
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update report status'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to update report status',
            'details': str(e)
        }), 500
