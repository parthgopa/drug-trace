from flask import Blueprint, request, jsonify
from models.scan_location import ScanLocation
from models.drug import Drug
from utils.auth import token_required, role_required
from pydantic import BaseModel, ValidationError
from typing import Optional
from bson import ObjectId

supply_chain_bp = Blueprint('supply_chain', __name__)

class ScanProductRequest(BaseModel):
    serial_number: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "serial_number": "DRG-2024-ABC123",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "address": "New Delhi, India",
                "notes": "Product dispatched to distributor"
            }
        }

# ==================== MANUFACTURER ENDPOINTS ====================

@supply_chain_bp.route('/manufacturer/scan', methods=['POST'])
@token_required
@role_required('manufacturer')
def manufacturer_scan(current_user):
    """
    Manufacturer scans product to record creation/dispatch
    
    Scan Types:
    - manufacture: Product created at manufacturing facility
    - distribution: Product dispatched to distributor
    
    Geo-location is auto-fetched and can be edited by user
    """
    try:
        data = request.get_json()
        validated_data = ScanProductRequest(**data)
        
        # Verify product exists and belongs to this manufacturer
        drug = Drug.find_by_serial(validated_data.serial_number)
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Verify manufacturer owns this product
        if drug.get('manufacturer_id') != current_user['user_id']:
            return jsonify({
                'success': False,
                'error': 'Unauthorized: This product does not belong to you'
            }), 403
        
        # Determine scan type based on existing scans
        existing_scans = ScanLocation.get_product_journey(validated_data.serial_number)
        
        # If no scans exist, this is manufacture scan
        # If scans exist, this is distribution scan
        scan_type = 'manufacture' if len(existing_scans) == 0 else 'distribution'
        
        # Create scan location record
        scan_location = ScanLocation.create(
            serial_number=validated_data.serial_number,
            scanned_by_id=current_user['user_id'],
            scanned_by_role='manufacturer',
            latitude=validated_data.latitude,
            longitude=validated_data.longitude,
            address=validated_data.address,
            scan_type=scan_type,
            notes=validated_data.notes
        )
        
        return jsonify({
            'success': True,
            'message': f'Product scanned successfully ({scan_type})',
            'scan': {
                '_id': scan_location['_id'],
                'serial_number': scan_location['serial_number'],
                'scan_type': scan_location['scan_type'],
                'location': scan_location['location'],
                'scanned_at': scan_location['scanned_at'].isoformat()
            }
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
            'error': 'Failed to record scan',
            'details': str(e)
        }), 500

@supply_chain_bp.route('/manufacturer/scans', methods=['GET'])
@token_required
@role_required('manufacturer')
def get_manufacturer_scans(current_user):
    """
    Get all scans performed by this manufacturer
    """
    try:
        limit = int(request.args.get('limit', 100))
        
        scans = ScanLocation.get_by_user(current_user['user_id'], limit)
        
        return jsonify({
            'success': True,
            'scans': [{
                '_id': scan['_id'],
                'serial_number': scan['serial_number'],
                'scan_type': scan['scan_type'],
                'location': scan['location'],
                'notes': scan.get('notes'),
                'scanned_at': scan['scanned_at'].isoformat(),
                'drug_info': {
                    'drug_name': scan['drug_info']['drug_name'],
                    'batch_number': scan['drug_info']['batch_number']
                } if scan.get('drug_info') else None
            } for scan in scans],
            'total': len(scans)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch scans',
            'details': str(e)
        }), 500

# ==================== DISTRIBUTOR ENDPOINTS ====================

@supply_chain_bp.route('/distributor/scan', methods=['POST'])
@token_required
@role_required('distributor')
def distributor_scan(current_user):
    """
    Distributor scans product to record receipt/movement
    
    Scan Types:
    - distribution: Product received/in-transit at distributor
    
    Geo-location is auto-fetched and can be edited by user
    """
    try:
        data = request.get_json()
        validated_data = ScanProductRequest(**data)
        
        # Verify product exists
        drug = Drug.find_by_serial(validated_data.serial_number)
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Check if product has been manufactured (has at least one scan)
        existing_scans = ScanLocation.get_product_journey(validated_data.serial_number)
        if len(existing_scans) == 0:
            return jsonify({
                'success': False,
                'error': 'Product has not been manufactured yet'
            }), 400
        
        # Create scan location record
        scan_location = ScanLocation.create(
            serial_number=validated_data.serial_number,
            scanned_by_id=current_user['user_id'],
            scanned_by_role='distributor',
            latitude=validated_data.latitude,
            longitude=validated_data.longitude,
            address=validated_data.address,
            scan_type='distribution',
            notes=validated_data.notes
        )
        
        return jsonify({
            'success': True,
            'message': 'Product scanned successfully (distribution)',
            'scan': {
                '_id': scan_location['_id'],
                'serial_number': scan_location['serial_number'],
                'scan_type': scan_location['scan_type'],
                'location': scan_location['location'],
                'scanned_at': scan_location['scanned_at'].isoformat()
            },
            'journey': {
                'total_scans': len(existing_scans) + 1,
                'current_location': scan_location['location'].get('address', 'Unknown')
            }
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
            'error': 'Failed to record scan',
            'details': str(e)
        }), 500

@supply_chain_bp.route('/distributor/scans', methods=['GET'])
@token_required
@role_required('distributor')
def get_distributor_scans(current_user):
    """
    Get all scans performed by this distributor
    """
    try:
        limit = int(request.args.get('limit', 100))
        
        scans = ScanLocation.get_by_user(current_user['user_id'], limit)
        
        return jsonify({
            'success': True,
            'scans': [{
                '_id': scan['_id'],
                'serial_number': scan['serial_number'],
                'scan_type': scan['scan_type'],
                'location': scan['location'],
                'notes': scan.get('notes'),
                'scanned_at': scan['scanned_at'].isoformat(),
                'drug_info': {
                    'drug_name': scan['drug_info']['drug_name'],
                    'batch_number': scan['drug_info']['batch_number'],
                    'manufacturer': scan['drug_info']['manufacturer']
                } if scan.get('drug_info') else None
            } for scan in scans],
            'total': len(scans)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch scans',
            'details': str(e)
        }), 500

# ==================== RETAILER ENDPOINTS ====================

@supply_chain_bp.route('/retailer/scan', methods=['POST'])
@token_required
@role_required('retailer')
def retailer_scan(current_user):
    """
    Retailer scans product to record receipt at retail location
    
    Scan Types:
    - retail: Product received at retail store
    
    Geo-location is auto-fetched and can be edited by user
    """
    try:
        data = request.get_json()
        validated_data = ScanProductRequest(**data)
        
        # Verify product exists
        drug = Drug.find_by_serial(validated_data.serial_number)
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Check if product has been in supply chain (has at least one scan)
        existing_scans = ScanLocation.get_product_journey(validated_data.serial_number)
        if len(existing_scans) == 0:
            return jsonify({
                'success': False,
                'error': 'Product has not entered the supply chain yet'
            }), 400
        
        # Create scan location record
        scan_location = ScanLocation.create(
            serial_number=validated_data.serial_number,
            scanned_by_id=current_user['user_id'],
            scanned_by_role='retailer',
            latitude=validated_data.latitude,
            longitude=validated_data.longitude,
            address=validated_data.address,
            scan_type='retail',
            notes=validated_data.notes
        )
        
        return jsonify({
            'success': True,
            'message': 'Product scanned successfully (retail)',
            'scan': {
                '_id': scan_location['_id'],
                'serial_number': scan_location['serial_number'],
                'scan_type': scan_location['scan_type'],
                'location': scan_location['location'],
                'scanned_at': scan_location['scanned_at'].isoformat()
            },
            'journey': {
                'total_scans': len(existing_scans) + 1,
                'current_location': scan_location['location'].get('address', 'Unknown')
            }
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
            'error': 'Failed to record scan',
            'details': str(e)
        }), 500

@supply_chain_bp.route('/retailer/scans', methods=['GET'])
@token_required
@role_required('retailer')
def get_retailer_scans(current_user):
    """
    Get all scans performed by this retailer
    """
    try:
        limit = int(request.args.get('limit', 100))
        
        scans = ScanLocation.get_by_user(current_user['user_id'], limit)
        
        return jsonify({
            'success': True,
            'scans': [{
                '_id': scan['_id'],
                'serial_number': scan['serial_number'],
                'scan_type': scan['scan_type'],
                'location': scan['location'],
                'notes': scan.get('notes'),
                'scanned_at': scan['scanned_at'].isoformat(),
                'drug_info': {
                    'drug_name': scan['drug_info']['drug_name'],
                    'batch_number': scan['drug_info']['batch_number'],
                    'manufacturer': scan['drug_info']['manufacturer'],
                    'expiry_date': scan['drug_info']['expiry_date']
                } if scan.get('drug_info') else None
            } for scan in scans],
            'total': len(scans)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch scans',
            'details': str(e)
        }), 500

# ==================== COMMON ENDPOINTS ====================

@supply_chain_bp.route('/product/journey/<serial_number>', methods=['GET'])
@token_required
def get_product_journey(current_user, serial_number):
    """
    Get complete supply chain journey for a product
    
    Available to all authenticated users
    Shows chronological movement through supply chain
    """
    try:
        # Verify product exists
        drug = Drug.find_by_serial(serial_number)
        if not drug:
            return jsonify({
                'success': False,
                'error': 'Product not found'
            }), 404
        
        # Get journey
        journey = ScanLocation.get_product_journey(serial_number)
        
        # Format response
        journey_data = []
        for scan in journey:
            journey_data.append({
                'scan_type': scan['scan_type'],
                'scanned_by_role': scan['scanned_by_role'],
                'scanned_by': {
                    'name': scan['scanned_by']['name'],
                    'company_name': scan['scanned_by'].get('company_name')
                } if scan.get('scanned_by') else None,
                'location': scan['location'],
                'notes': scan.get('notes'),
                'scanned_at': scan['scanned_at'].isoformat()
            })
        
        # Get latest location
        latest_scan = journey[-1] if journey else None
        
        return jsonify({
            'success': True,
            'product': {
                'serial_number': drug['serial_number'],
                'drug_name': drug['drug_name'],
                'batch_number': drug['batch_number'],
                'manufacturer': drug['manufacturer']
            },
            'journey': journey_data,
            'current_location': latest_scan['location'].get('address', 'Unknown') if latest_scan else 'Not scanned yet',
            'total_scans': len(journey)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch product journey',
            'details': str(e)
        }), 500

@supply_chain_bp.route('/statistics', methods=['GET'])
@token_required
def get_supply_chain_statistics(current_user):
    """
    Get supply chain statistics based on user role
    """
    try:
        role = current_user['role']
        user_id = current_user['user_id']
        
        if role == 'manufacturer':
            # Get scans for manufacturer's products
            analytics = ScanLocation.get_analytics_by_manufacturer(user_id)
            return jsonify({
                'success': True,
                'statistics': analytics
            }), 200
            
        elif role in ['distributor', 'retailer']:
            # Get scans performed by this user
            scans = ScanLocation.get_by_user(user_id, limit=1000)
            
            # Calculate statistics
            total_scans = len(scans)
            unique_products = len(set(scan['serial_number'] for scan in scans))
            
            # Group by date
            from collections import defaultdict
            scans_by_date = defaultdict(int)
            for scan in scans:
                date = scan['scanned_at'].date().isoformat()
                scans_by_date[date] += 1
            
            return jsonify({
                'success': True,
                'statistics': {
                    'total_scans': total_scans,
                    'unique_products': unique_products,
                    'scans_by_date': dict(scans_by_date),
                    'recent_scans': scans[:10]  # Last 10 scans
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Statistics not available for this role'
            }), 403
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch statistics',
            'details': str(e)
        }), 500
