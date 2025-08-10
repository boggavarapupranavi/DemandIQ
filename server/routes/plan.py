# server/routes/plan.py
from flask import Blueprint, request, jsonify
import logging
import numpy as np
from typing import Any, Dict, List, Union
from utils.optimizer import StockOptimizer

plan_bp = Blueprint('plan', __name__)
logger = logging.getLogger(__name__)

def make_json_serializable(obj: Any) -> Any:
    """Convert NumPy types to Python native types."""
    if isinstance(obj, (np.float32, np.float64)):
        return round(float(obj), 2)
    if isinstance(obj, float):
        return round(obj, 2)
    if isinstance(obj, (np.int32, np.int64)):
        return int(obj)
    if isinstance(obj, int):
        return obj
    if isinstance(obj, np.ndarray):
        return [make_json_serializable(i) for i in obj]
    if isinstance(obj, (list, tuple)):
        return [make_json_serializable(i) for i in obj]
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    return obj

@plan_bp.route('/plan', methods=['POST'])
def create_stock_plan():
    """Create optimized stock plan considering shelf life constraints."""
    try:
        data = request.get_json() or {}
        
        # Get parameters from request
        product_ids = data.get('product_ids', None)  # None means use all products
        planning_horizon = data.get('planning_horizon', 7)
        
        if product_ids is not None:
            if not isinstance(product_ids, list) or len(product_ids) == 0:
                return jsonify({"error": "Product IDs must be a non-empty list"}), 400

        # Initialize optimizer
        optimizer = StockOptimizer()
        
        # Create optimized stock plan
        stock_plan_result = optimizer.optimize_stock_plan(product_ids, planning_horizon)

        # Check if result is a dictionary and has the expected structure
        if not isinstance(stock_plan_result, dict) or not stock_plan_result.get('stock_plan'):
            return jsonify({"error": "No stock plan could be generated. Check if data files are uploaded."}), 500

        # Convert NumPy types to JSON-serializable format
        stock_plan_serializable = make_json_serializable(stock_plan_result)
        
        # Safely access dictionary values with type checking
        stock_plan = stock_plan_serializable.get('stock_plan', []) if isinstance(stock_plan_serializable, dict) else []
        summary = stock_plan_serializable.get('summary', {}) if isinstance(stock_plan_serializable, dict) else {}
        horizon = stock_plan_serializable.get('planning_horizon', f"{planning_horizon} days") if isinstance(stock_plan_serializable, dict) else f"{planning_horizon} days"
        total_products = stock_plan_serializable.get('total_products', 0) if isinstance(stock_plan_serializable, dict) else 0
        
        return jsonify({
            "message": "Stock plan created successfully",
            "stock_plan": stock_plan,
            "summary": summary,
            "planning_horizon": horizon,
            "total_products": total_products
        }), 200

    except FileNotFoundError as e:
        logger.error(f"Required files not found: {str(e)}")
        return jsonify({"error": "Required data files not found. Please upload data first."}), 404
    except Exception as e:
        logger.error(f"Stock planning error: {str(e)}")
        return jsonify({"error": f"Stock planning failed: {str(e)}"}), 500