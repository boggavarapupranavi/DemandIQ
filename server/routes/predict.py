# server/routes/predict.py
from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Any, Dict, List, Union
from utils.forecast import DemandForecaster

predict_bp = Blueprint('predict', __name__)
logger = logging.getLogger(__name__)

def make_json_serializable(obj: Any) -> Any:
    """Convert NumPy types to native Python types with rounding where applicable."""
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

@predict_bp.route('/predict', methods=['POST'])
def predict_demand():
    """Predict demand for next N days for specified products."""
    try:
        data = request.get_json() or {}

        # Get product_ids from request or use all available products
        product_ids = data.get('product_ids', [])
        days_ahead = data.get('days_ahead', 7)

        # If no product_ids provided, get some from products file
        if not product_ids:
            try:
                products_df = pd.read_csv('data/products.csv')
                product_ids = products_df['product_id'].unique()[:10].tolist()  # Get first 10
            except:
                return jsonify({"error": "No product IDs provided and couldn't load products data"}), 400

        if not isinstance(product_ids, list) or len(product_ids) == 0:
            return jsonify({"error": "Product IDs must be a non-empty list"}), 400

        # Initialize forecaster
        forecaster = DemandForecaster()

        # Load model and make predictions
        predictions = forecaster.predict_demand(product_ids, days_ahead)

        if not predictions:
            return jsonify({"error": "No predictions could be generated. Check if data files are uploaded."}), 500

        # Convert predictions to JSON-serializable types
        serializable_predictions = {}
        if isinstance(predictions, dict):
            for pid, preds in predictions.items():
                serializable_predictions[pid] = make_json_serializable(preds)

        return jsonify({
            "message": "Demand prediction completed",
            "forecast_period": f"{days_ahead} days",
            "predictions": serializable_predictions,
            "total_products": len(serializable_predictions)
        }), 200

    except FileNotFoundError as e:
        logger.error(f"Required files not found: {str(e)}")
        return jsonify({"error": "Required data files not found. Please upload sales and products data first."}), 404
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500