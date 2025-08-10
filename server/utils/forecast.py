"""
Demand forecasting utilities using XGBoost model.
Handles model training, loading, and prediction generation with better error handling.
"""

import pandas as pd
import numpy as np
import pickle
import os
from datetime import datetime, timedelta
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import logging

logger = logging.getLogger(__name__)

class DemandForecaster:
    """Handles demand forecasting using XGBoost regression with improved reliability."""
    
    def __init__(self, model_path='models/demand_model.pkl'):
        self.model_path = model_path
        self.model = None
        self.label_encoders = {}
        self.features = []
        self.is_trained = False
        
    def prepare_features(self, df):
        """Extract and engineer features from the dataset."""
        # Ensure date is datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            
            # Extract time-based features
            df['month'] = df['date'].dt.month
            df['day_of_month'] = df['date'].dt.day
            df['day_of_week'] = df['date'].dt.dayofweek + 1  # 1-7
            df['is_weekend'] = (df['day_of_week'].isin([6, 7])).astype(int)
            df['quarter'] = df['date'].dt.quarter
            
            # Create lag features for demand (if quantity_sold exists)
            if 'quantity_sold' in df.columns:
                df = df.sort_values(['product_id', 'date'])
                df['lag_1_demand'] = df.groupby('product_id')['quantity_sold'].shift(1)
                df['lag_7_demand'] = df.groupby('product_id')['quantity_sold'].shift(7)
                df['rolling_mean_7'] = df.groupby('product_id')['quantity_sold'].rolling(window=7, min_periods=1).mean().reset_index(0, drop=True)
        
        return df
    
    def train_model(self):
        """Train XGBoost model on available sales data with better validation."""
        try:
            # Check if required files exist
            required_files = ['data/sales.csv', 'data/products.csv']
            for file_path in required_files:
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"Required file {file_path} not found")
            
            # Load training data
            logger.info("Loading training data...")
            sales_df = pd.read_csv('data/sales.csv')
            products_df = pd.read_csv('data/products.csv')
            
            # Load weather data if available
            weather_df = None
            if os.path.exists('data/weather.csv'):
                weather_df = pd.read_csv('data/weather.csv')
                weather_df['date'] = pd.to_datetime(weather_df['date'])
            
            # Validate required columns
            required_sales_cols = ['date', 'product_id', 'quantity_sold']
            required_product_cols = ['product_id']
            
            missing_sales_cols = set(required_sales_cols) - set(sales_df.columns)
            missing_product_cols = set(required_product_cols) - set(products_df.columns)
            
            if missing_sales_cols:
                raise ValueError(f"Missing required columns in sales data: {missing_sales_cols}")
            if missing_product_cols:
                raise ValueError(f"Missing required columns in products data: {missing_product_cols}")
            
            # Prepare features
            sales_df = self.prepare_features(sales_df)
            
            # Merge datasets
            logger.info("Merging datasets...")
            train_data = sales_df.merge(products_df, on='product_id', how='left')
            
            if weather_df is not None:
                train_data = train_data.merge(weather_df, on='date', how='left')
            
            # Handle missing values
            train_data = train_data.dropna(subset=['quantity_sold'])  # Drop rows without target
            
            # Encode categorical variables
            categorical_cols = ['product_id']
            if 'category' in train_data.columns:
                categorical_cols.append('category')
                
            for col in categorical_cols:
                if col in train_data.columns:
                    le = LabelEncoder()
                    train_data[f'{col}_encoded'] = le.fit_transform(train_data[col].astype(str))
                    self.label_encoders[col] = le
            
            # Select features (only use columns that exist)
            potential_features = [
                'product_id_encoded', 'day_of_week', 'month', 'day_of_month',
                'is_weekend', 'quarter', 'lag_1_demand', 'lag_7_demand', 'rolling_mean_7'
            ]
            
            # Add product features if they exist
            if 'shelf_life_days' in train_data.columns:
                potential_features.append('shelf_life_days')
            if 'category_encoded' in train_data.columns:
                potential_features.append('category_encoded')
            if 'promotion' in train_data.columns:
                potential_features.append('promotion')
                
            # Add weather features if available
            if weather_df is not None:
                weather_features = ['temperature', 'humidity', 'precipitation']
                for feature in weather_features:
                    if feature in train_data.columns:
                        potential_features.append(feature)
            
            # Filter features that actually exist in the data
            features = [f for f in potential_features if f in train_data.columns]
            self.features = features
            
            logger.info(f"Using features: {features}")
            
            # Prepare training data
            X = train_data[features].fillna(0)
            y = train_data['quantity_sold']
            
            # Remove any infinite values
            X = X.replace([np.inf, -np.inf], 0)
            
            if len(X) < 10:
                raise ValueError("Insufficient training data (need at least 10 samples)")
            
            # Split data for validation
            X_train, X_val, y_train, y_val = train_test_split(
                X, y, test_size=0.2, random_state=42, shuffle=True
            )
            
            # Train model with better parameters
            logger.info("Training XGBoost model...")
            self.model = XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            )
            
            self.model.fit(X_train, y_train)
            
            # Validate model
            y_pred = self.model.predict(X_val)
            mae = mean_absolute_error(y_val, y_pred)
            rmse = np.sqrt(mean_squared_error(y_val, y_pred))
            
            logger.info(f"Model validation - MAE: {mae:.2f}, RMSE: {rmse:.2f}")
            
            # Save model and encoders
            model_data = {
                'model': self.model,
                'label_encoders': self.label_encoders,
                'features': features,
                'validation_mae': mae,
                'validation_rmse': rmse,
                'training_date': datetime.now().isoformat()
            }
            
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump(model_data, f)
            
            self.is_trained = True
            logger.info(f"Model trained and saved to {self.model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            raise e
    
    def load_model(self):
        """Load trained model from disk."""
        try:
            if not os.path.exists(self.model_path):
                logger.info("Model not found, training new model...")
                return self.train_model()
            
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)
            
            self.model = model_data['model']
            self.label_encoders = model_data['label_encoders']
            self.features = model_data['features']
            self.is_trained = True
            
            logger.info(f"Model loaded successfully. Features: {len(self.features)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            # Try to retrain the model if loading fails
            try:
                logger.info("Attempting to retrain model...")
                return self.train_model()
            except Exception as train_error:
                logger.error(f"Failed to retrain model: {str(train_error)}")
                raise train_error
    
    def predict_demand(self, product_ids, days_ahead=7):
        """Predict demand for specified products and time period."""
        if not self.load_model():
            raise Exception("Failed to load forecasting model")
        
        try:
            # Load product data for context
            if not os.path.exists('data/products.csv'):
                raise FileNotFoundError("Products data not found")
                
            products_df = pd.read_csv('data/products.csv')
            
            # Get recent sales data for context
            historical_avg = {}
            if os.path.exists('data/sales.csv'):
                sales_df = pd.read_csv('data/sales.csv')
                historical_avg = sales_df.groupby('product_id')['quantity_sold'].mean().to_dict()
            
            predictions = {}
            
            for product_id in product_ids:
                try:
                    # Get product info
                    product_info = products_df[products_df['product_id'] == product_id]
                    if product_info.empty:
                        logger.warning(f"Product {product_id} not found in products data")
                        continue
                    
                    product_info = product_info.iloc[0]
                    
                    # Generate predictions for next days_ahead days
                    daily_predictions = []
                    forecast_dates = []
                    start_date = datetime.now()
                    
                    for day in range(days_ahead):
                        pred_date = start_date + timedelta(days=day)
                        forecast_dates.append(pred_date.strftime('%Y-%m-%d'))
                        
                        try:
                            # Create feature vector
                            features_dict = {}
                            
                            # Encode product_id
                            if 'product_id' in self.label_encoders:
                                if str(product_id) in self.label_encoders['product_id'].classes_:
                                    features_dict['product_id_encoded'] = self.label_encoders['product_id'].transform([str(product_id)])[0]
                                else:
                                    features_dict['product_id_encoded'] = 0
                            
                            # Encode category if available
                            if 'category' in self.label_encoders and 'category' in product_info:
                                if str(product_info['category']) in self.label_encoders['category'].classes_:
                                    features_dict['category_encoded'] = self.label_encoders['category'].transform([str(product_info['category'])])[0]
                                else:
                                    features_dict['category_encoded'] = 0
                            
                            # Time-based features
                            features_dict.update({
                                'day_of_week': pred_date.weekday() + 1,
                                'month': pred_date.month,
                                'day_of_month': pred_date.day,
                                'is_weekend': 1 if pred_date.weekday() >= 5 else 0,
                                'quarter': (pred_date.month - 1) // 3 + 1
                            })
                            
                            # Product features
                            if 'shelf_life_days' in product_info:
                                features_dict['shelf_life_days'] = product_info['shelf_life_days']
                            
                            # Default values for missing features
                            if 'promotion' in self.features:
                                features_dict['promotion'] = 0
                            
                            # Weather defaults (could be enhanced with actual weather API)
                            weather_defaults = {
                                'temperature': 22.0,
                                'humidity': 60.0,
                                'precipitation': 0.0
                            }
                            features_dict.update({k: v for k, v in weather_defaults.items() if k in self.features})
                            
                            # Lag features (use historical average as approximation)
                            hist_avg = historical_avg.get(product_id, 30.0)
                            lag_defaults = {
                                'lag_1_demand': hist_avg,
                                'lag_7_demand': hist_avg,
                                'rolling_mean_7': hist_avg
                            }
                            features_dict.update({k: v for k, v in lag_defaults.items() if k in self.features})
                            
                            # Create feature array in the correct order
                            feature_array = np.array([[features_dict.get(feat, 0) for feat in self.features]])
                            
                            # Make prediction
                            pred = self.model.predict(feature_array)[0]
                            daily_predictions.append(max(0, round(float(pred), 2)))
                            
                        except Exception as pred_error:
                            logger.error(f"Error predicting for day {day}: {str(pred_error)}")
                            # Use historical average as fallback
                            fallback_pred = historical_avg.get(product_id, 30.0)
                            daily_predictions.append(max(0, round(fallback_pred, 2)))
                    
                    predictions[product_id] = {
                        'product_name': product_info.get('product_name', f'Product {product_id}'),
                        'daily_forecast': daily_predictions,
                        'total_forecast': sum(daily_predictions),
                        'forecast_dates': forecast_dates,
                        'avg_daily_demand': sum(daily_predictions) / len(daily_predictions) if daily_predictions else 0
                    }
                    
                except Exception as product_error:
                    logger.error(f"Error processing product {product_id}: {str(product_error)}")
                    continue
            
            return predictions
            
        except Exception as e:
            logger.error(f"Prediction generation failed: {str(e)}")
            raise e