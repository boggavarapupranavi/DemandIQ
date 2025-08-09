import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Calendar, AlertTriangle, TrendingUp, Loader2, Play, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

import ProductSelector from '../components/ProductSelector'
import StockPlanCard from '../components/StockPlanCard'
import SummaryCard from '../components/SummaryCard'
import { createStockPlan } from '../api/plan'

const StockPlanPage = () => {
  const [selectedProducts, setSelectedProducts] = useState([])
  const [planningHorizon, setPlanningHorizon] = useState(7)
  const [loading, setLoading] = useState(false)
  const [stockPlan, setStockPlan] = useState(null)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const handleCreatePlan = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await createStockPlan({
        productIds: selectedProducts,
        planningHorizon: planningHorizon
      })
      
      setStockPlan(result)
      toast.success(`Stock plan created for ${selectedProducts.length} products`)
    } catch (error) {
      console.error('Stock plan error:', error)
      setError(error.response?.data?.error || 'Failed to create stock plan')
      setStockPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredStockPlan = () => {
    if (!stockPlan?.stock_plan) return []
    
    if (filterStatus === 'all') return stockPlan.stock_plan
    
    return stockPlan.stock_plan.filter(item => item.stock_status === filterStatus)
  }

  const getStatusCounts = () => {
    if (!stockPlan?.summary?.stock_status_distribution) return {}
    return stockPlan.summary.stock_status_distribution
  }

  const getAverageServiceLevel = () => {
    if (!stockPlan?.summary?.overall_service_level) return 0
    return stockPlan.summary.overall_service_level
  }

  const getAverageWastageRisk = () => {
    if (!stockPlan?.summary?.average_wastage_risk) return 0
    return stockPlan.summary.average_wastage_risk * 100
  }

  const getTotalRecommendedStock = () => {
    if (!stockPlan?.summary?.total_recommended_stock) return 0
    return stockPlan.summary.total_recommended_stock
  }

  const statusOptions = [
    { value: 'all', label: 'All Products', color: 'text-gray-300' },
    { value: 'optimal', label: 'Optimal', color: 'text-green-400' },
    { value: 'overstock', label: 'Overstock', color: 'text-orange-400' },
    { value: 'understock', label: 'Understock', color: 'text-red-400' },
  ]

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
          Shelf-Life Aware Stock Planning
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Generate optimized stock plans that balance demand fulfillment with waste minimization, considering product shelf life constraints.
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 mb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Products
            </label>
            <ProductSelector
              selectedProducts={selectedProducts}
              onProductsChange={setSelectedProducts}
              disabled={loading}
            />
          </div>

          {/* Planning Horizon */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Planning Horizon
            </label>
            <select
              value={planningHorizon}
              onChange={(e) => setPlanningHorizon(Number(e.target.value))}
              disabled={loading}
              className="w-full glass-card p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-400/50 disabled:opacity-50"
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={21}>21 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={handleCreatePlan}
              disabled={loading || selectedProducts.length === 0}
              className="w-full primary-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Plan...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Create Stock Plan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {stockPlan && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Products"
            value={stockPlan.total_products || 0}
            subtitle="Plans generated"
            icon={Package}
            color="primary"
            index={0}
          />
          
          <SummaryCard
            title="Total Stock Needed"
            value={getTotalRecommendedStock().toFixed(0)}
            subtitle="Units recommended"
            icon={TrendingUp}
            color="green"
            index={1}
          />
          
          <SummaryCard
            title="Avg Service Level"
            value={`${getAverageServiceLevel().toFixed(1)}%`}
            subtitle="Demand fulfillment"
            icon={Calendar}
            color="blue"
            index={2}
          />
          
          <SummaryCard
            title="Avg Wastage Risk"
            value={`${getAverageWastageRisk().toFixed(1)}%`}
            subtitle="Spoilage potential"
            icon={AlertTriangle}
            color={getAverageWastageRisk() > 50 ? 'red' : getAverageWastageRisk() > 30 ? 'orange' : 'green'}
            index={3}
          />
        </div>
      )}

      {/* Filter and Status Distribution */}
      {stockPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0"
        >
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    filterStatus === option.value
                      ? 'bg-primary-500 text-white'
                      : 'glass-button hover:bg-white/20'
                  }`}
                >
                  <span className={option.color}>{option.label}</span>
                  {option.value !== 'all' && (
                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                      {getStatusCounts()[option.value] || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-300">
            Showing {getFilteredStockPlan().length} of {stockPlan?.stock_plan?.length || 0} products
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center border-red-500/20 bg-red-500/5 mb-8"
        >
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Stock Plan Generation Failed</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={handleCreatePlan}
            className="glass-button"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Creating Stock Plan</h3>
          <p className="text-gray-300">
            Optimizing inventory levels for {selectedProducts.length} products with shelf life constraints...
          </p>
          <div className="mt-6 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      )}

      {/* Stock Plan Results */}
      <AnimatePresence>
        {stockPlan && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stock Plan Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {getFilteredStockPlan().map((planData, index) => (
                <StockPlanCard
                  key={planData.product_id}
                  planData={planData}
                  index={index}
                />
              ))}
            </div>

            {/* Plan Summary */}
            {stockPlan.summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary-400" />
                  Plan Summary & Insights
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 mb-2">Planning Horizon</div>
                    <div className="text-2xl font-bold text-white">
                      {stockPlan.planning_horizon}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 mb-2">Total Demand</div>
                    <div className="text-2xl font-bold text-white">
                      {stockPlan.summary.total_predicted_demand?.toFixed(0) || '0'}
                    </div>
                    <div className="text-xs text-gray-400">Units forecasted</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 mb-2">Stock Coverage</div>
                    <div className="text-2xl font-bold text-primary-400">
                      {stockPlan.summary.total_predicted_demand ? 
                        ((stockPlan.summary.total_recommended_stock / stockPlan.summary.total_predicted_demand) * 100).toFixed(0) + '%'
                        : '0%'
                      }
                    </div>
                    <div className="text-xs text-gray-400">Demand coverage</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-gray-300 mb-2">Generated</div>
                    <div className="text-lg font-bold text-white">
                      {stockPlan.summary.optimization_date ? 
                        new Date(stockPlan.summary.optimization_date).toLocaleDateString() :
                        new Date().toLocaleDateString()
                      }
                    </div>
                    <div className="text-xs text-gray-400">Plan date</div>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Stock Status Distribution</h4>
                  <div className="flex space-x-4">
                    {Object.entries(getStatusCounts()).map(([status, count]) => (
                      <div key={status} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'optimal' ? 'bg-green-400' :
                          status === 'overstock' ? 'bg-orange-400' :
                          status === 'understock' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-sm text-gray-300 capitalize">{status}</span>
                        <span className="text-sm font-medium text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!stockPlan && !loading && !error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center"
        >
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-4">Ready to Create Stock Plan</h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Select products and planning horizon above, then click "Create Stock Plan" to generate optimized inventory recommendations.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Shelf life aware</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              <span>Waste minimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Service optimization</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default StockPlanPage