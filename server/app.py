"""
Flask application entry point for grocery demand forecasting system.
Handles CORS, blueprint registration, and application configuration.
"""

from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging
from routes.upload import upload_bp
from routes.predict import predict_bp
from routes.plan import plan_bp
from routes.products import products_bp 

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure Flask application."""
    app = Flask(__name__)
    
    # Enable CORS for React frontend
    CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'])
    
    # Configuration
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['UPLOAD_FOLDER'] = 'data'
    
    # Ensure required directories exist
    os.makedirs('data', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(predict_bp, url_prefix='/api')
    app.register_blueprint(plan_bp, url_prefix='/api')
    app.register_blueprint(products_bp, url_prefix='/api')  # Add this line
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return jsonify({"status": "healthy", "message": "Grocery demand forecasting API is running"})
    
    # Error handlers
    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({"error": "File too large. Maximum size is 16MB."}), 413
    
    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {str(e)}")
        return jsonify({"error": "Internal server error occurred"}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)