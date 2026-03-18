from datetime import datetime
from bson import ObjectId
from utils.database import get_database

class Report:
    collection_name = 'reports'

    @staticmethod
    def create(user_id: str, serial_number: str, issue_description: str, issue_type: str):
        db = get_database()
        
        report_data = {
            'user_id': user_id,
            'serial_number': serial_number,
            'issue_description': issue_description,
            'issue_type': issue_type,
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db[Report.collection_name].insert_one(report_data)
        report_data['_id'] = result.inserted_id
        
        return report_data

    @staticmethod
    def find_by_user(user_id: str, skip: int = 0, limit: int = 50):
        db = get_database()
        cursor = db[Report.collection_name].find({'user_id': user_id}) \
            .sort('created_at', -1) \
            .skip(skip) \
            .limit(limit)
        
        return list(cursor)

    @staticmethod
    def get_all(skip: int = 0, limit: int = 100):
        db = get_database()
        cursor = db[Report.collection_name].find() \
            .sort('created_at', -1) \
            .skip(skip) \
            .limit(limit)
        
        return list(cursor)

    @staticmethod
    def update_status(report_id: str, status: str, admin_notes: str = None):
        db = get_database()
        
        update_data = {
            'status': status,
            'updated_at': datetime.utcnow()
        }
        
        if admin_notes:
            update_data['admin_notes'] = admin_notes
        
        result = db[Report.collection_name].update_one(
            {'_id': ObjectId(report_id)},
            {'$set': update_data}
        )
        
        return result.modified_count > 0

    @staticmethod
    def count_by_status(status: str = None):
        db = get_database()
        query = {'status': status} if status else {}
        return db[Report.collection_name].count_documents(query)

    @staticmethod
    def find_by_manufacturer(manufacturer_id: str, skip: int = 0, limit: int = 50, status: str = None):
        """
        Optimized aggregation to get reports for drugs belonging to a manufacturer.
        Uses $lookup to join reports with drugs collection.
        """
        db = get_database()
        
        # First get all serial numbers for this manufacturer
        drug_collection = db['drugs']
        drugs_cursor = drug_collection.find(
            {'manufacturer_id': manufacturer_id},
            {'serial_number': 1}
        )
        serial_numbers = [drug['serial_number'] for drug in drugs_cursor]
        
        if not serial_numbers:
            return [], 0
        
        # Build query
        query = {'serial_number': {'$in': serial_numbers}}
        if status:
            query['status'] = status
        
        # Get total count for pagination
        total_count = db[Report.collection_name].count_documents(query)
        
        # Get reports with pagination
        cursor = db[Report.collection_name].find(query) \
            .sort('created_at', -1) \
            .skip(skip) \
            .limit(limit)
        
        return list(cursor), total_count

    @staticmethod
    def get_statistics_by_manufacturer(manufacturer_id: str):
        """
        Get report statistics for a manufacturer.
        """
        db = get_database()
        
        # Get all serial numbers for this manufacturer
        drug_collection = db['drugs']
        drugs_cursor = drug_collection.find(
            {'manufacturer_id': manufacturer_id},
            {'serial_number': 1}
        )
        serial_numbers = [drug['serial_number'] for drug in drugs_cursor]
        
        if not serial_numbers:
            return {
                'total_reports': 0,
                'pending': 0,
                'resolved': 0,
                'rejected': 0
            }
        
        pipeline = [
            {'$match': {'serial_number': {'$in': serial_numbers}}},
            {'$group': {
                '_id': '$status',
                'count': {'$sum': 1}
            }}
        ]
        
        results = list(db[Report.collection_name].aggregate(pipeline))
        
        stats = {
            'total_reports': sum(r['count'] for r in results),
            'pending': 0,
            'resolved': 0,
            'rejected': 0
        }
        
        for r in results:
            if r['_id'] in stats:
                stats[r['_id']] = r['count']
        
        return stats

    @staticmethod
    def get_statistics():
        """
        Get overall report statistics.
        """
        db = get_database()
        
        pipeline = [
            {'$group': {
                '_id': '$status',
                'count': {'$sum': 1}
            }}
        ]
        
        results = list(db[Report.collection_name].aggregate(pipeline))
        
        stats = {
            'total': 0,
            'pending': 0,
            'resolved': 0,
            'rejected': 0
        }
        
        for r in results:
            if r['_id'] in stats:
                stats[r['_id']] = r['count']
            stats['total'] += r['count']
        
        return stats
