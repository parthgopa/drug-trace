from datetime import datetime
from bson import ObjectId
from utils.database import get_database

class ScanLog:
    collection_name = 'scan_logs'

    @staticmethod
    def create(user_id: str, serial_number: str, scan_result: dict, drug_info: dict = None):
        db = get_database()
        
        log_data = {
            'user_id': user_id,
            'serial_number': serial_number,
            'scan_result': scan_result,
            'drug_info': drug_info,
            'scanned_at': datetime.utcnow()
        }
        
        result = db[ScanLog.collection_name].insert_one(log_data)
        log_data['_id'] = result.inserted_id
        
        return log_data

    @staticmethod
    def find_by_user(user_id: str, skip: int = 0, limit: int = 50):
        db = get_database()
        cursor = db[ScanLog.collection_name].find({'user_id': user_id}) \
            .sort('scanned_at', -1) \
            .skip(skip) \
            .limit(limit)
        
        return list(cursor)

    @staticmethod
    def count_by_user(user_id: str):
        db = get_database()
        return db[ScanLog.collection_name].count_documents({'user_id': user_id})

    @staticmethod
    def get_all(skip: int = 0, limit: int = 100):
        db = get_database()
        cursor = db[ScanLog.collection_name].find() \
            .sort('scanned_at', -1) \
            .skip(skip) \
            .limit(limit)
        
        return list(cursor)

    @staticmethod
    def get_statistics():
        db = get_database()
        
        total_scans = db[ScanLog.collection_name].count_documents({})
        
        genuine_scans = db[ScanLog.collection_name].count_documents({
            'scan_result.status': 'genuine'
        })
        
        fake_scans = db[ScanLog.collection_name].count_documents({
            'scan_result.status': 'fake'
        })
        
        expired_scans = db[ScanLog.collection_name].count_documents({
            'scan_result.status': 'expired'
        })
        
        recalled_scans = db[ScanLog.collection_name].count_documents({
            'scan_result.status': 'recalled'
        })
        
        return {
            'total_scans': total_scans,
            'genuine': genuine_scans,
            'fake': fake_scans,
            'expired': expired_scans,
            'recalled': recalled_scans
        }

    @staticmethod
    def get_manufacturer_statistics(manufacturer_id: str):
        db = get_database()
        
        total_scans = db[ScanLog.collection_name].count_documents({
            'drug_info.manufacturer_id': manufacturer_id
        })
        
        genuine_scans = db[ScanLog.collection_name].count_documents({
            'drug_info.manufacturer_id': manufacturer_id,
            'scan_result.status': 'genuine'
        })
        
        fake_scans = db[ScanLog.collection_name].count_documents({
            'drug_info.manufacturer_id': manufacturer_id,
            'scan_result.status': 'fake'
        })
        
        suspicious_scans = db[ScanLog.collection_name].count_documents({
            'drug_info.manufacturer_id': manufacturer_id,
            'scan_result.status': {'$in': ['fake', 'recalled', 'expired']}
        })
        
        return {
            'total_scans': total_scans,
            'genuine_scans': genuine_scans,
            'fake_scans': fake_scans,
            'suspicious_scans': suspicious_scans
        }
