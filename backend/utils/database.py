from pymongo import MongoClient, ASCENDING
from config import Config

class Database:
    _instance = None
    _client = None
    _db = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance

    def connect(self):
        if self._client is None:
            self._client = MongoClient(Config.MONGODB_URI)
            self._db = self._client[Config.DATABASE_NAME]
            self._create_indexes()
        return self._db

    def _create_indexes(self):
        self._db.users.create_index([("email", ASCENDING)], unique=True)
        self._db.drugs.create_index([("serial_number", ASCENDING)], unique=True)
        self._db.drugs.create_index([("batch_number", ASCENDING)])
        self._db.drugs.create_index([("manufacturer_id", ASCENDING)])
        self._db.scan_logs.create_index([("user_id", ASCENDING)])
        self._db.scan_logs.create_index([("scanned_at", ASCENDING)])
        self._db.reports.create_index([("user_id", ASCENDING)])
        self._db.reports.create_index([("serial_number", ASCENDING)])
        self._db.reports.create_index([("created_at", ASCENDING)])
        self._db.reports.create_index([("status", ASCENDING)])
        self._db.scan_locations.create_index([("serial_number", ASCENDING)])
        self._db.scan_locations.create_index([("scanned_by_id", ASCENDING)])
        self._db.scan_locations.create_index([("scanned_at", ASCENDING)])

    def get_db(self):
        if self._db is None:
            return self.connect()
        return self._db

    def close(self):
        if self._client:
            self._client.close()
            self._client = None
            self._db = None

db_instance = Database()

def get_database():
    return db_instance.get_db()
