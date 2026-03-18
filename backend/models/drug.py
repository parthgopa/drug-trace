from datetime import datetime
from bson import ObjectId
from utils.database import get_database
from utils.helpers import generate_serial_number, generate_qr_code

class Drug:
    collection_name = 'drugs'

    @staticmethod
    def create_batch(drug_name: str, manufacturer: str, batch_number: str, 
                     quantity: int, expiry_date: str, manufacturing_date: str,
                     manufacturer_id: str, description: str = None):
        db = get_database()
        
        drugs = []
        qr_codes = []
        
        for i in range(1, quantity + 1):
            serial_number = generate_serial_number(drug_name, batch_number, i)
            qr_code = generate_qr_code(serial_number)
            
            drug_data = {
                'drug_name': drug_name,
                'manufacturer': manufacturer,
                'manufacturer_id': manufacturer_id,
                'batch_number': batch_number,
                'serial_number': serial_number,
                'qr_code': qr_code,
                'expiry_date': expiry_date,
                'manufacturing_date': manufacturing_date,
                'description': description,
                'status': 'active',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            drugs.append(drug_data)
            qr_codes.append({
                'serial_number': serial_number,
                'qr_code': qr_code
            })
        
        result = db[Drug.collection_name].insert_many(drugs)
        
        return {
            'batch_number': batch_number,
            'quantity': quantity,
            'serial_numbers': [drug['serial_number'] for drug in drugs],
            'qr_codes': qr_codes,
            'inserted_ids': [str(id) for id in result.inserted_ids]
        }

    @staticmethod
    def find_by_serial(serial_number: str):
        db = get_database()
        return db[Drug.collection_name].find_one({'serial_number': serial_number})

    @staticmethod
    def find_by_batch(batch_number: str):
        db = get_database()
        return list(db[Drug.collection_name].find({'batch_number': batch_number}))

    @staticmethod
    def find_by_manufacturer(manufacturer_id: str, skip: int = 0, limit: int = 50):
        db = get_database()
        cursor = db[Drug.collection_name].find({'manufacturer_id': manufacturer_id}) \
            .sort('created_at', -1) \
            .skip(skip) \
            .limit(limit)
        
        return list(cursor)

    @staticmethod
    def get_all(skip: int = 0, limit: int = 50):
        db = get_database()
        cursor = db[Drug.collection_name].find() \
            .sort('created_at', -1) \
            .skip(skip) \
            .limit(limit)
        
        return list(cursor)

    @staticmethod
    def recall_batch(batch_number: str, manufacturer_id: str):
        db = get_database()
        
        result = db[Drug.collection_name].update_many(
            {
                'batch_number': batch_number,
                'manufacturer_id': manufacturer_id
            },
            {
                '$set': {
                    'status': 'recalled',
                    'recalled_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return result.modified_count

    @staticmethod
    def count_by_manufacturer(manufacturer_id: str):
        db = get_database()
        return db[Drug.collection_name].count_documents({'manufacturer_id': manufacturer_id})

    @staticmethod
    def get_batches_by_manufacturer(manufacturer_id: str, include_deleted: bool = False):
        db = get_database()
        match_query = {'manufacturer_id': manufacturer_id}
        if not include_deleted:
            match_query['status'] = {'$ne': 'deleted'}
        
        pipeline = [
            {'$match': match_query},
            {'$group': {
                '_id': '$batch_number',
                'drug_name': {'$first': '$drug_name'},
                'manufacturer': {'$first': '$manufacturer'},
                'quantity': {'$sum': 1},
                'status': {'$first': '$status'},
                'expiry_date': {'$first': '$expiry_date'},
                'manufacturing_date': {'$first': '$manufacturing_date'},
                'created_at': {'$first': '$created_at'}
            }},
            {'$sort': {'created_at': -1}}
        ]
        
        return list(db[Drug.collection_name].aggregate(pipeline))

    @staticmethod
    def void_batch(batch_number: str, manufacturer_id: str):
        db = get_database()
        
        result = db[Drug.collection_name].update_many(
            {
                'batch_number': batch_number,
                'manufacturer_id': manufacturer_id
            },
            {
                '$set': {
                    'status': 'voided',
                    'voided_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return result.modified_count

    @staticmethod
    def soft_delete_batch(batch_number: str, manufacturer_id: str):
        db = get_database()
        
        result = db[Drug.collection_name].update_many(
            {
                'batch_number': batch_number,
                'manufacturer_id': manufacturer_id
            },
            {
                '$set': {
                    'status': 'deleted',
                    'deleted_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        return result.modified_count

    @staticmethod
    def duplicate_batch(original_batch_number: str, new_batch_number: str, 
                       manufacturer_id: str, updates: dict = None):
        db = get_database()
        
        original_drugs = Drug.find_by_batch(original_batch_number)
        
        if not original_drugs:
            return None
        
        if original_drugs[0]['manufacturer_id'] != manufacturer_id:
            return None
        
        template = original_drugs[0]
        quantity = len(original_drugs)
        
        drug_name = updates.get('drug_name', template['drug_name'])
        expiry_date = updates.get('expiry_date', template['expiry_date'])
        manufacturing_date = updates.get('manufacturing_date', template['manufacturing_date'])
        description = updates.get('description', template.get('description'))
        
        return Drug.create_batch(
            drug_name=drug_name,
            manufacturer=template['manufacturer'],
            batch_number=new_batch_number,
            quantity=quantity,
            expiry_date=expiry_date,
            manufacturing_date=manufacturing_date,
            manufacturer_id=manufacturer_id,
            description=description
        )
