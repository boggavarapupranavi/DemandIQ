"""
Products route blueprint for retrieving product information.
"""

from flask import Blueprint, jsonify
import pandas as pd
import logging
import os

products_bp = Blueprint('products', __name__)
logger = logging.getLogger(__name__)

@products_bp.route('/products', methods=['GET'])
def get_available_products():
    """Get list of all available products from the products.csv file."""
    try:
        # Path to products.csv file
        products_file_path = 'data/products.csv'
        
        if not os.path.exists(products_file_path):
            logger.error(f"Products file not found at {products_file_path}")
            return jsonify({"error": "Products data file not found. Please upload the products.csv file first."}), 404

        # Read the products dataset
        df = pd.read_csv(products_file_path)
        logger.info(f"Loaded products data with columns: {list(df.columns)}")
        
        # Check for product_id column (adjust based on your actual column name)
        product_column = None
        possible_columns = ['product_id', 'Product_ID', 'ProductID', 'product', 'Product', 'id', 'ID']
        
        for col in possible_columns:
            if col in df.columns:
                product_column = col
                break
        
        if not product_column:
            logger.error(f"No product ID column found. Available columns: {list(df.columns)}")
            return jsonify({
                "error": "Product ID column not found in products.csv", 
                "available_columns": list(df.columns)
            }), 500

        # Get unique product IDs
        unique_products = df[product_column].unique().tolist()
        
        # Remove any NaN values and convert to string
        unique_products = [str(prod) for prod in unique_products if pd.notna(prod)]
        
        # Sort the products for better UX
        unique_products.sort()
        
        logger.info(f"Found {len(unique_products)} unique products")
        
        return jsonify({
            "message": "Products retrieved successfully",
            "products": unique_products,
            "total_count": len(unique_products),
            "source": "products.csv"
        }), 200

    except Exception as e:
        logger.error(f"Error retrieving products: {str(e)}")
        return jsonify({"error": f"Failed to retrieve products: {str(e)}"}), 500


@products_bp.route('/products/<product_id>/info', methods=['GET'])
def get_product_info(product_id):
    """Get detailed information about a specific product."""
    try:
        products_file_path = 'data/products.csv'
        
        if not os.path.exists(products_file_path):
            return jsonify({"error": "Products data file not found."}), 404

        # Read the products dataset
        df = pd.read_csv(products_file_path)
        
        # Find product_id column
        product_column = None
        possible_columns = ['product_id', 'Product_ID', 'ProductID', 'product', 'Product', 'id', 'ID']
        
        for col in possible_columns:
            if col in df.columns:
                product_column = col
                break
        
        if not product_column:
            return jsonify({"error": "Product ID column not found"}), 500

        # Find the specific product
        product_data = df[df[product_column] == product_id]
        
        if product_data.empty:
            return jsonify({"error": f"Product {product_id} not found"}), 404
        
        # Convert to dictionary and make JSON serializable
        product_info = product_data.iloc[0].to_dict()
        
        # Convert any NaN values to None
        for key, value in product_info.items():
            if pd.isna(value):
                product_info[key] = None
        
        return jsonify({
            "message": "Product information retrieved successfully",
            "product": product_info
        }), 200

    except Exception as e:
        logger.error(f"Error retrieving product info: {str(e)}")
        return jsonify({"error": f"Failed to retrieve product info: {str(e)}"}), 500


@products_bp.route('/products/stats', methods=['GET'])
def get_product_stats():
    """Get statistics about the products dataset."""
    try:
        products_file_path = 'data/products.csv'
        
        if not os.path.exists(products_file_path):
            return jsonify({"error": "Products data file not found."}), 404

        df = pd.read_csv(products_file_path)
        
        # Get basic statistics
        stats = {
            "total_products": len(df),
            "columns": list(df.columns),
            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "missing_values": df.isnull().sum().to_dict()
        }
        
        # If there's a category column, get category distribution
        category_columns = ['category', 'Category', 'CATEGORY', 'product_category']
        for col in category_columns:
            if col in df.columns:
                stats["category_distribution"] = df[col].value_counts().to_dict()
                break
        
        return jsonify({
            "message": "Product statistics retrieved successfully",
            "statistics": stats
        }), 200

    except Exception as e:
        logger.error(f"Error retrieving product stats: {str(e)}")
        return jsonify({"error": f"Failed to retrieve product stats: {str(e)}"}), 500