from utils.database import get_database
from datetime import datetime
from bson import ObjectId

class ScanLocation:
    collection_name = 'scan_locations'
    
    @staticmethod
    def create(serial_number: str, scanned_by_id: str, scanned_by_role: str, 
               location: dict = None, scan_type: str = 'verification', notes: str = None):
        """
        Record a scan location event in the supply chain
        
        Args:
            serial_number: Drug serial number
            scanned_by_id: User ID who scanned
            scanned_by_role: Role of scanner (manufacturer/distributor/retailer/customer)
            location: Dict with latitude, longitude, address
            scan_type: Type of scan (manufacture/distribution/retail/verification)
            notes: Optional notes about the scan
        """
        db = get_database()
        
        scan_location = {
            'serial_number': serial_number,
            'scanned_by_id': scanned_by_id,
            'scanned_by_role': scanned_by_role,
            'location': location or {},
            'scan_type': scan_type,
            'notes': notes,
            'scanned_at': datetime.utcnow(),
            'created_at': datetime.utcnow()
        }
        
        result = db[ScanLocation.collection_name].insert_one(scan_location)
        scan_location['_id'] = str(result.inserted_id)
        
        return scan_location
    
    @staticmethod
    def get_product_journey(serial_number: str):
        """
        Get complete journey/history of a product by serial number
        Returns chronological list of all scan locations
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
    def get_by_manufacturer(manufacturer_id: str, limit: int = 100):
        """
        Get all scan locations for products from a specific manufacturer
        Used for analytics dashboard
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
    def get_analytics_by_manufacturer(manufacturer_id: str):
        """
        Get analytics data for manufacturer dashboard
        Returns scan distribution by type, location, and time
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
    def count_by_serial(serial_number: str):
        """Count total scans for a specific product"""
        db = get_database()
        return db[ScanLocation.collection_name].count_documents({'serial_number': serial_number})
