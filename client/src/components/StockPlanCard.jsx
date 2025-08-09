import { motion } from 'framer-motion'
import { Package, AlertTriangle, CheckCircle, TrendingUp, Clock, DollarSign } from 'lucide-react'

const StockPlanCard = ({ planData, index = 0 }) => {
  if (!planData) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded mb-4"></div>
        <div className="h-8 bg-white/10 rounded mb-2"></div>
        <div className="h-4 bg-white/10 rounded"></div>
      </div>
    )
  }

  const {
    product_id,
    product_name,
    shelf_life_days,
    predicted_demand,
    recommended_stock,
    stock_status,
    wastage_risk,
    service_level,
    recommendations = [],
    cost_analysis = {}
  } = planData

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'overstock': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'understock': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="h-4 w-4" />
      case 'overstock': return <AlertTriangle className="h-4 w-4" />
      case 'understock': return <AlertTriangle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getRiskLevel = (risk) => {
    if (risk < 0.3) return { label: 'Low', color: 'text-green-400' }
    if (risk < 0.6) return { label: 'Medium', color: 'text-orange-400' }
    return { label: 'High', color: 'text-red-400' }
  }

  const riskLevel = getRiskLevel(wastage_risk)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-card p-6 hover:bg-white/15 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Package className="h-5 w-5 mr-2 text-primary-400" />
            {product_name || `Product ${product_id}`}
          </h3>
          <p className="text-sm text-gray-300 mt-1">ID: {product_id}</p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${getStatusColor(stock_status)}`}>
          {getStatusIcon(stock_status)}
          <span className="capitalize">{stock_status}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-300">Predicted Demand</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {predicted_demand?.toFixed(1) || '0'} units
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-300">Recommended Stock</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {recommended_stock?.toFixed(1) || '0'} units
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-300">Shelf Life</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {shelf_life_days || 'N/A'} days
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-300">Wastage Risk</span>
          </div>
          <div className={`text-lg font-semibold ${riskLevel.color}`}>
            {riskLevel.label}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">Service Level</span>
            <span className="text-white">{service_level?.toFixed(1) || '0'}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, service_level || 0)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-300">Wastage Risk</span>
            <span className={riskLevel.color}>{(wastage_risk * 100)?.toFixed(1) || '0'}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                wastage_risk < 0.3 ? 'bg-green-500' : 
                wastage_risk < 0.6 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, (wastage_risk || 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cost Analysis */}
      {cost_analysis && Object.keys(cost_analysis).length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Cost Analysis
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-300">Inventory Value</span>
              <div className="text-white font-medium">
                ${cost_analysis.estimated_inventory_value?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <span className="text-gray-300">Weekly Holding</span>
              <div className="text-white font-medium">
                ${cost_analysis.weekly_holding_cost?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <span className="text-gray-300">Spoilage Risk</span>
              <div className="text-orange-400 font-medium">
                ${cost_analysis.potential_spoilage_cost?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <span className="text-gray-300">Total Risk</span>
              <div className="text-red-400 font-medium">
                ${cost_analysis.total_cost_risk?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-white mb-3">Recommendations</h4>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div 
                key={idx}
                className="text-sm text-gray-300 bg-white/5 rounded-lg p-3 border-l-2 border-primary-400/50"
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default StockPlanCard