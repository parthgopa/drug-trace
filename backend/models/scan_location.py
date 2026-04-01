from utils.database import get_database
from datetime import datetime
from typing import Optional, Dict, Any, List
from bson import ObjectId

class ScanLocation:
    """
    ScanLocation Model for tracking product movement through supply chain
    
    Enhanced with geo-location support:
    - Latitude/Longitude coordinates
    - Human-readable address
    - Role-based scan types
    """
    collection_name = 'scan_locations'
    
    @staticmethod
    def create(serial_number: str, 
               scanned_by_id: str, 
               scanned_by_role: str, 
               latitude: Optional[float] = None,
               longitude: Optional[float] = None,
               address: Optional[str] = None,
               scan_type: str = 'verification', 
               notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Record a scan location event in the supply chain
        
        Args:
            serial_number: Drug serial number
            scanned_by_id: User ID who scanned
            scanned_by_role: Role of scanner (manufacturer/distributor/retailer/customer)
            latitude: GPS latitude coordinate
            longitude: GPS longitude coordinate
            address: Human-readable address
            scan_type: Type of scan (manufacture/distribution/retail/verification)
            notes: Optional notes about the scan
            
        Returns:
            Created scan location document
        """
        db = get_database()
        
        # Build location object
        location = {}
        if latitude is not None and longitude is not None:
            location['coordinates'] = {
                'latitude': latitude,
                'longitude': longitude
            }
        if address:
            location['address'] = address
        
        scan_location = {
            'serial_number': serial_number,
            'scanned_by_id': scanned_by_id,
            'scanned_by_role': scanned_by_role,
            'location': location,
            'scan_type': scan_type,
            'notes': notes,
            'scanned_at': datetime.utcnow(),
            'created_at': datetime.utcnow()
        }
        
        result = db[ScanLocation.collection_name].insert_one(scan_location)
        scan_location['_id'] = str(result.inserted_id)
        
        return scan_location
    
    @staticmethod
    def get_product_journey(serial_number: str) -> List[Dict[str, Any]]:
        """
        Get complete journey/history of a product by serial number
        Returns chronological list of all scan locations
        
        Args:
            serial_number: Drug serial number
            
        Returns:
            List of scan location documents with user info
        """
        db = get_database()
        
        pipeline = [
            {'$match': {'serial_number': serial_number}},
            {'$sort': {'scanned_at': 1}},
            {
                '$lookup': {
                    'from': 'users',
                    'let': {'scanned_by_id': {'$toObjectId': '$scanned_by_id'}},
                    'pipeline': [
                        {'$match': {'$expr': {'$eq': ['$_id', '$$scanned_by_id']}}},
                        {'$project': {'name': 1, 'company_name': 1, 'email': 1, 'role': 1}}
                    ],
                    'as': 'scanned_by'
                }
            },
            {'$unwind': {'path': '$scanned_by', 'preserveNullAndEmptyArrays': True}}
        ]
        
        locations = list(db[ScanLocation.collection_name].aggregate(pipeline))
        
        for loc in locations:
            loc['_id'] = str(loc['_id'])
            if 'scanned_by' in loc and loc['scanned_by']:
                loc['scanned_by']['_id'] = str(loc['scanned_by']['_id'])
        
        return locations
    
    @staticmethod
    def get_by_user(user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all scans performed by a specific user
        
        Args:
            user_id: User ID
            limit: Maximum number of results
            
        Returns:
            List of scan location documents
        """
        db = get_database()
        
        pipeline = [
            {'$match': {'scanned_by_id': user_id}},
            {'$sort': {'scanned_at': -1}},
            {'$limit': limit},
            {
                '$lookup': {
                    'from': 'drugs',
                    'localField': 'serial_number',
                    'foreignField': 'serial_number',
                    'as': 'drug_info'
                }
            },
            {'$unwind': {'path': '$drug_info', 'preserveNullAndEmptyArrays': True}}
        ]
        
        locations = list(db[ScanLocation.collection_name].aggregate(pipeline))
        
        for loc in locations:
            loc['_id'] = str(loc['_id'])
            if 'drug_info' in loc and loc['drug_info']:
                loc['drug_info']['_id'] = str(loc['drug_info']['_id'])
        
        return locations
    
    @staticmethod
    def get_by_manufacturer(manufacturer_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get all scan locations for products from a specific manufacturer
        Used for analytics dashboard
        
        Args:
            manufacturer_id: Manufacturer user ID
            limit: Maximum number of results
            
        Returns:
            List of scan location documents
        """
        db = get_database()
        
        # First get all serial numbers for this manufacturer
        drugs = db['drugs'].find(
            {'manufacturer_id': manufacturer_id},
            {'serial_number': 1}
        )
        serial_numbers = [drug['serial_number'] for drug in drugs]
        
        # Get scan locations for these serial numbers
        pipeline = [
            {'$match': {'serial_number': {'$in': serial_numbers}}},
            {'$sort': {'scanned_at': -1}},
            {'$limit': limit},
            {
                '$lookup': {
                    'from': 'drugs',
                    'localField': 'serial_number',
                    'foreignField': 'serial_number',
                    'as': 'drug_info'
                }
            },
            {'$unwind': {'path': '$drug_info', 'preserveNullAndEmptyArrays': True}}
        ]
        
        locations = list(db[ScanLocation.collection_name].aggregate(pipeline))
        
        for loc in locations:
            loc['_id'] = str(loc['_id'])
            if 'drug_info' in loc and loc['drug_info']:
                loc['drug_info']['_id'] = str(loc['drug_info']['_id'])
        
        return locations
    
    @staticmethod
    def get_analytics_by_manufacturer(manufacturer_id: str) -> Dict[str, Any]:
        """
        Get analytics data for manufacturer dashboard
        Returns scan distribution by type, location, and time
        
        Args:
            manufacturer_id: Manufacturer user ID
            
        Returns:
            Dictionary with analytics data
        """
        db = get_database()
        
        # Get all serial numbers for this manufacturer
        drugs = db['drugs'].find(
            {'manufacturer_id': manufacturer_id},
            {'serial_number': 1}
        )
        serial_numbers = [drug['serial_number'] for drug in drugs]
        
        # Aggregate scan data
        pipeline = [
            {'$match': {'serial_number': {'$in': serial_numbers}}},
            {
                '$facet': {
                    'by_type': [
                        {'$group': {
                            '_id': '$scan_type',
                            'count': {'$sum': 1}
                        }}
                    ],
                    'by_role': [
                        {'$group': {
                            '_id': '$scanned_by_role',
                            'count': {'$sum': 1}
                        }}
                    ],
                    'recent_scans': [
                        {'$sort': {'scanned_at': -1}},
                        {'$limit': 10},
                        {
                            '$lookup': {
                                'from': 'drugs',
                                'localField': 'serial_number',
                                'foreignField': 'serial_number',
                                'as': 'drug_info'
                            }
                        },
                        {'$unwind': {'path': '$drug_info', 'preserveNullAndEmptyArrays': True}}
                    ],
                    'total_scans': [
                        {'$count': 'count'}
                    ]
                }
            }
        ]
        
        result = list(db[ScanLocation.collection_name].aggregate(pipeline))
        
        if result:
            analytics = result[0]
            
            # Format recent scans
            for scan in analytics.get('recent_scans', []):
                scan['_id'] = str(scan['_id'])
                if 'drug_info' in scan and scan['drug_info']:
                    scan['drug_info']['_id'] = str(scan['drug_info']['_id'])
            
            return {
                'by_type': analytics.get('by_type', []),
                'by_role': analytics.get('by_role', []),
                'recent_scans': analytics.get('recent_scans', []),
                'total_scans': analytics['total_scans'][0]['count'] if analytics.get('total_scans') else 0
            }
        
        return {
            'by_type': [],
            'by_role': [],
            'recent_scans': [],
            'total_scans': 0
        }
    
    @staticmethod
    def count_by_serial(serial_number: str) -> int:
        """
        Count total scans for a specific product
        
        Args:
            serial_number: Drug serial number
            
        Returns:
            Total scan count
        """
        db = get_database()
        return db[ScanLocation.collection_name].count_documents({'serial_number': serial_number})
    
    @staticmethod
    def get_latest_location(serial_number: str) -> Optional[Dict[str, Any]]:
        """
        Get the most recent scan location for a product
        
        Args:
            serial_number: Drug serial number
            
        Returns:
            Latest scan location document or None
        """
        db = get_database()
        
        scan = db[ScanLocation.collection_name].find_one(
            {'serial_number': serial_number},
            sort=[('scanned_at', -1)]
        )
        
        if scan:
            scan['_id'] = str(scan['_id'])
        
        return scan
    
    @staticmethod
    def get_scans_by_role(role: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Get all scans performed by users with a specific role
        
        Args:
            role: User role (manufacturer/distributor/retailer/customer)
            page: Page number
            limit: Items per page
            
        Returns:
            Dictionary with scans and pagination info
        """
        db = get_database()
        
        skip = (page - 1) * limit
        
        pipeline = [
            {'$match': {'scanned_by_role': role}},
            {'$sort': {'scanned_at': -1}},
            {'$skip': skip},
            {'$limit': limit},
            {
                '$lookup': {
                    'from': 'drugs',
                    'localField': 'serial_number',
                    'foreignField': 'serial_number',
                    'as': 'drug_info'
                }
            },
            {'$unwind': {'path': '$drug_info', 'preserveNullAndEmptyArrays': True}},
            {
                '$lookup': {
                    'from': 'users',
                    'let': {'scanned_by_id': {'$toObjectId': '$scanned_by_id'}},
                    'pipeline': [
                        {'$match': {'$expr': {'$eq': ['$_id', '$$scanned_by_id']}}},
                        {'$project': {'name': 1, 'company_name': 1, 'role': 1}}
                    ],
                    'as': 'scanned_by'
                }
            },
            {'$unwind': {'path': '$scanned_by', 'preserveNullAndEmptyArrays': True}}
        ]
        
        scans = list(db[ScanLocation.collection_name].aggregate(pipeline))
        total = db[ScanLocation.collection_name].count_documents({'scanned_by_role': role})
        
        for scan in scans:
            scan['_id'] = str(scan['_id'])
            if 'drug_info' in scan and scan['drug_info']:
                scan['drug_info']['_id'] = str(scan['drug_info']['_id'])
            if 'scanned_by' in scan and scan['scanned_by']:
                scan['scanned_by']['_id'] = str(scan['scanned_by']['_id'])
        
        return {
            'scans': scans,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit
        }
