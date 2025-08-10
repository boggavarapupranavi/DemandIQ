"""
Upload endpoints for sales, product, and weather data.
Handles CSV file validation and storage.
"""

from flask import Blueprint, request, jsonify, current_app
import pandas as pd
import os
import logging

upload_bp = Blueprint('upload', __name__)
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_csv_structure(df, file_type):
    """Validate CSV structure based on file type."""
    required_columns = {
        'sales': ['date', 'product_id', 'quantity_sold', 'day_of_week', 'promotion'],
        'products': ['product_id', 'product_name', 'shelf_life_days', 'category'],
        'weather': ['date', 'temperature', 'humidity', 'precipitation']
    }
    
    if file_type not in required_columns:
        return False, f"Unknown file type: {file_type}"
    
    missing_cols = set(required_columns[file_type]) - set(df.columns)
    if missing_cols:
        return False, f"Missing required columns: {missing_cols}"
    
    return True, "Valid structure"

@upload_bp.route('/upload', methods=['POST'])
def upload_files():
    """Upload and validate CSV files for sales, products, and weather data."""
    try:
        uploaded_files = {}
        
        # Check if files are present
        for file_type in ['sales', 'products', 'weather']:
            if file_type not in request.files:
                continue
                
            file = request.files[file_type]
            if file.filename == '':
                continue
                
            if not allowed_file(file.filename):
                return jsonify({"error": f"Invalid file type for {file_type}. Only CSV files allowed."}), 400
            
            try:
                # Read and validate CSV
                df = pd.read_csv(file.stream)
                
                # Validate structure
                is_valid, message = validate_csv_structure(df, file_type)
                if not is_valid:
                    return jsonify({"error": f"Invalid {file_type} file structure: {message}"}), 400
                
                # Save file
                filename = f"{file_type}.csv"
                filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                df.to_csv(filepath, index=False)
                
                uploaded_files[file_type] = {
                    "filename": filename,
                    "rows": len(df),
                    "columns": list(df.columns)
                }
                
                logger.info(f"Successfully uploaded {file_type} file with {len(df)} rows")
                
            except Exception as e:
                logger.error(f"Error processing {file_type} file: {str(e)}")
                return jsonify({"error": f"Error processing {file_type} file: {str(e)}"}), 400
        
        if not uploaded_files:
            return jsonify({"error": "No valid files uploaded"}), 400
        
        return jsonify({
            "message": "Files uploaded successfully",
            "uploaded_files": uploaded_files
        }), 200
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500
