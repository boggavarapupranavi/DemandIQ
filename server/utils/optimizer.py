"""
Stock planning optimization considering shelf life constraints.
Implements intelligent stock distribution to minimize waste while ensuring adequate supply.
"""
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from utils.forecast import DemandForecaster

logger = logging.getLogger(__name__)

class StockOptimizer:
    """Optimizes stock planning with shelf life awareness and waste minimization."""
    
    def __init__(self):
        self.forecaster = DemandForecaster()
    
    def optimize_stock_plan(self, product_ids=None, planning_horizon=7):
        """Create optimized stock plan considering shelf life constraints."""
        try:
            # If no product_ids provided, get all products
            if product_ids is None:
                if not os.path.exists('data/products.csv'):
                    raise FileNotFoundError("Products data not found")
                products_df = pd.read_csv('data/products.csv')
                product_ids = products_df['product_id'].unique().tolist()[:10]  # Limit to first 10 for demo
            
            # Get demand predictions
            logger.info(f"Getting demand predictions for {len(product_ids)} products...")
            predictions = self.forecaster.predict_demand(product_ids, planning_horizon)
            
            # Load product information
            products_df = pd.read_csv('data/products.csv')
            
            stock_plan = []
            
            for product_id in product_ids:
                if product_id not in predictions:
                    logger.warning(f"No predictions available for product {product_id}")
                    continue
                
                product_info = products_df[products_df['product_id'] == product_id]
                if product_info.empty:
                    logger.warning(f"Product {product_id} not found in products data")
                    continue
                    
                product_info = product_info.iloc[0]
                shelf_life = product_info.get('shelf_life_days', 7)  # Default 7 days
                daily_forecast = predictions[product_id]['daily_forecast']
                total_forecast = predictions[product_id]['total_forecast']
                
                # Optimize stock distribution
                optimized_plan = self._optimize_single_product(
                    daily_forecast, shelf_life, planning_horizon, product_id
                )
                
                # Calculate stock status
                stock_status = self._determine_stock_status(
                    optimized_plan['total_stock'], total_forecast, shelf_life
                )
                
                # Generate recommendations
                recommendations = self._generate_recommendations(
                    optimized_plan, stock_status, shelf_life, product_info
                )
                
                stock_plan.append({
                    'product_id': product_id,
                    'product_name': product_info.get('product_name', f'Product {product_id}'),
                    'shelf_life_days': int(shelf_life),
                    'predicted_demand': round(total_forecast, 2),
                    'recommended_stock': optimized_plan['total_stock'],
                    'daily_stock_plan': optimized_plan['daily_stock'],
                    'stock_status': stock_status,
                    'wastage_risk': optimized_plan['wastage_risk'],
                    'service_level': optimized_plan['service_level'],
                    'recommendations': recommendations,
                    'cost_analysis': self._calculate_costs(optimized_plan, product_info)
                })
            
            return {
                'stock_plan': stock_plan,
                'planning_horizon': f"{planning_horizon} days",
                'total_products': len(stock_plan),
                'summary': self._generate_summary(stock_plan)
            }
            
        except Exception as e:
            logger.error(f"Stock optimization failed: {str(e)}")
            raise e
    
    def _optimize_single_product(self, daily_forecast, shelf_life, horizon, product_id):
        """Optimize stock for a single product considering shelf life."""
        n_days = min(horizon, len(daily_forecast))
        
        if n_days == 0 or not daily_forecast:
            return {
                'daily_stock': [0.0] * max(1, n_days),
                'total_stock': 0.0,
                'wastage_risk': 0.0,
                'service_level': 0.0
            }
        
        # Calculate safety stock based on demand variability
        avg_demand = sum(daily_forecast) / len(daily_forecast)
        demand_std = np.std(daily_forecast) if len(daily_forecast) > 1 else avg_demand * 0.2
        safety_stock_factor = min(0.5, demand_std / max(avg_demand, 1))  # Cap at 50%
        
        # Strategy: Balance service level with waste minimization
        daily_stock = []
        total_demand = sum(daily_forecast)
        
        for day in range(n_days):
            day_demand = daily_forecast[day] if day < len(daily_forecast) else avg_demand
            
            # Base stock calculation
            base_stock = day_demand
            
            # Add safety stock (more for shorter shelf life products)
            shelf_life_factor = max(0.1, min(1.0, shelf_life / 30))  # Scale based on shelf life
            safety_stock = base_stock * safety_stock_factor * shelf_life_factor
            
            # Adjust for weekend/weekday patterns
            if day < len(daily_forecast):
                # If this is a high-demand day, increase stock slightly
                if day_demand > avg_demand * 1.2:
                    base_stock *= 1.1
                elif day_demand < avg_demand * 0.8:
                    base_stock *= 0.9
            
            recommended_stock = base_stock + safety_stock
            daily_stock.append(max(0, round(recommended_stock, 2)))
        
        total_stock = sum(daily_stock)
        
        # Calculate wastage risk based on shelf life vs planning horizon
        wastage_risk = self._calculate_wastage_risk(daily_stock, daily_forecast, shelf_life)
        
        # Calculate service level (ability to meet demand)
        service_level = min(100, (total_stock / max(total_demand, 1)) * 100)
        
        # If service level is too low, increase stock
        if service_level < 80:
            adjustment_factor = 80 / max(service_level, 1)
            daily_stock = [stock * adjustment_factor for stock in daily_stock]
            total_stock = sum(daily_stock)
            service_level = min(100, (total_stock / max(total_demand, 1)) * 100)
            wastage_risk = self._calculate_wastage_risk(daily_stock, daily_forecast, shelf_life)
        
        return {
            'daily_stock': [round(stock, 2) for stock in daily_stock],
            'total_stock': round(total_stock, 2),
            'wastage_risk': round(wastage_risk, 3),
            'service_level': round(service_level, 2)
        }
    
    def _calculate_wastage_risk(self, daily_stock, daily_forecast, shelf_life):
        """Calculate the risk of product wastage based on shelf life and demand."""
        if not daily_stock or not daily_forecast:
            return 0.0
        
        total_stock = sum(daily_stock)
        total_demand = sum(daily_forecast)
        
        if total_demand == 0:
            return 1.0 if total_stock > 0 else 0.0
        
        # Base wastage risk: excess stock ratio
        excess_ratio = max(0, (total_stock - total_demand) / total_demand)
        
        # Shelf life factor: shorter shelf life = higher risk
        shelf_life_risk = max(0, (14 - shelf_life) / 14)  # Risk increases as shelf life decreases from 14 days
        
        # Planning horizon factor: longer planning vs shelf life = higher risk
        horizon_days = len(daily_stock)
        horizon_risk = max(0, (horizon_days - shelf_life) / max(horizon_days, 1))
        
        # Combined wastage risk (weighted average)
        wastage_risk = (excess_ratio * 0.5 + shelf_life_risk * 0.3 + horizon_risk * 0.2)
        
        return min(1.0, wastage_risk)
    
    def _determine_stock_status(self, recommended_stock, predicted_demand, shelf_life):
        """Determine if stock level is optimal, overstocked, or understocked."""
        if predicted_demand == 0:
            return 'optimal' if recommended_stock == 0 else 'overstock'
        
        stock_ratio = recommended_stock / predicted_demand
        
        # Adjust thresholds based on shelf life
        if shelf_life <= 3:  # Very perishable
            understock_threshold = 0.9
            overstock_threshold = 1.2
        elif shelf_life <= 7:  # Moderately perishable
            understock_threshold = 0.85
            overstock_threshold = 1.3
        else:  # Long shelf life
            understock_threshold = 0.8
            overstock_threshold = 1.4
        
        if stock_ratio < understock_threshold:
            return 'understock'
        elif stock_ratio > overstock_threshold:
            return 'overstock'
        else:
            return 'optimal'
    
    def _generate_recommendations(self, optimized_plan, stock_status, shelf_life, product_info):
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        
        if stock_status == 'overstock':
            recommendations.append(f"Consider reducing order quantity by {max(5, int((optimized_plan['total_stock'] - sum([30] * len(optimized_plan['daily_stock']))) / 2))} units")
            if shelf_life <= 7:
                recommendations.append("Monitor closely for spoilage due to short shelf life")
            recommendations.append("Consider promotional pricing to move excess inventory")
            
        elif stock_status == 'understock':
            deficit = max(10, int(sum([30] * len(optimized_plan['daily_stock'])) - optimized_plan['total_stock']))
            recommendations.append(f"Increase order quantity by approximately {deficit} units")
            recommendations.append("Monitor sales closely to avoid stockouts")
            
        else:  # optimal
            recommendations.append("Stock level appears optimal for forecasted demand")
            if optimized_plan['wastage_risk'] > 0.3:
                recommendations.append("Monitor inventory turnover to minimize waste")
        
        # Shelf life specific recommendations
        if shelf_life <= 3:
            recommendations.append("Use FIFO (First In, First Out) inventory management")
            recommendations.append("Consider daily delivery for very perishable items")
        elif shelf_life <= 7:
            recommendations.append("Implement proper cold chain management")
            
        # Service level recommendations
        if optimized_plan['service_level'] < 90:
            recommendations.append("Consider increasing safety stock to improve service level")
        elif optimized_plan['service_level'] > 120:
            recommendations.append("Review forecasting accuracy - may be over-forecasting")
        
        return recommendations[:4]  # Limit to top 4 recommendations
    
    def _calculate_costs(self, optimized_plan, product_info):
        """Calculate estimated costs and savings."""
        # Assume some default cost structure (in a real system, this would come from cost data)
        unit_cost = 5.0  # Default $5 per unit
        holding_cost_rate = 0.02  # 2% of inventory value per day
        spoilage_cost_rate = optimized_plan['wastage_risk']
        
        total_stock = optimized_plan['total_stock']
        
        inventory_value = total_stock * unit_cost
        holding_cost = inventory_value * holding_cost_rate * 7  # 7 days
        potential_spoilage_cost = inventory_value * spoilage_cost_rate
        
        return {
            'estimated_inventory_value': round(inventory_value, 2),
            'weekly_holding_cost': round(holding_cost, 2),
            'potential_spoilage_cost': round(potential_spoilage_cost, 2),
            'total_cost_risk': round(holding_cost + potential_spoilage_cost, 2)
        }
    
    def _generate_summary(self, stock_plan):
        """Generate summary statistics for the entire stock plan."""
        if not stock_plan:
            return {}
        
        total_stock = sum(item['recommended_stock'] for item in stock_plan)
        total_demand = sum(item['predicted_demand'] for item in stock_plan)
        avg_service_level = sum(item['service_level'] for item in stock_plan) / len(stock_plan)
        avg_wastage_risk = sum(item['wastage_risk'] for item in stock_plan) / len(stock_plan)
        
        status_counts = {}
        for item in stock_plan:
            status = item['stock_status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            'total_recommended_stock': round(total_stock, 2),
            'total_predicted_demand': round(total_demand, 2),
            'overall_service_level': round(avg_service_level, 2),
            'average_wastage_risk': round(avg_wastage_risk, 3),
            'stock_status_distribution': status_counts,
            'optimization_date': datetime.now().isoformat()
        }