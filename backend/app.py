from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from utils.database import db_instance
from routes.auth import auth_bp
from routes.manufacturer import manufacturer_bp
from routes.customer import customer_bp
from routes.admin import admin_bp
from routes.owner import owner_bp
from routes.supply_chain import supply_chain_bp
from routes.distributor import distributor_bp

def create_app():
    app = Flask(__name__)
    
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    db_instance.connect()
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(manufacturer_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(owner_bp, url_prefix='/owner')
    app.register_blueprint(supply_chain_bp, url_prefix='/supply-chain')
    app.register_blueprint(distributor_bp)
    
    @app.route('/', methods=['GET'])
    def home():
        return jsonify({
            'success': True,
            'message': 'Drug Track & Trace API - Role-Based Supply Chain System',
            'version': '2.0.0',
            'endpoints': {
                'auth': '/auth',
                'owner': '/owner',
                'supply_chain': '/supply-chain',
                'manufacturer': '/manufacturer',
                'distributor': '/distributor',
                'customer': '/customer',
                'admin': '/admin'
            }
        }), 200
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'success': True,
            'status': 'healthy',
            'database': 'connected'
        }), 200
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Endpoint not found'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host=Config.HOST, port=Config.PORT, debug=True)
