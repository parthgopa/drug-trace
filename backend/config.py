import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    DATABASE_NAME = os.getenv('DATABASE_NAME', 'track-trace')
    JWT_SECRET = os.getenv('JWT_SECRET', 'pharma-track-trace-secret-key-2024')
    JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    PORT = int(os.getenv('PORT', 8001))
    HOST = os.getenv('HOST', '0.0.0.0')
