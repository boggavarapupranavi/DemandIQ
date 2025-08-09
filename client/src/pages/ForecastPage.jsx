import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Calendar, BarChart3, LineChart, Loader2, AlertCircle, Play } from 'lucide-react'
import toast from 'react-hot-toast'

import ProductSelector from '../components/ProductSelector'
import ForecastChart from '../components/ForecastChart'
import SummaryCard from '../components/SummaryCard'
import { predictDemand } from '../api/forecast'

const ForecastPage = () => {
  const [selectedProducts, setSelectedProducts] = useState([])
  const [daysAhead, setDaysAhead] = useState(7)
  const [chartType, setChartType] = useState('line')
  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerateForecast = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const result = await predictDemand({
        productIds: selectedProducts,
        daysAhead: daysAhead
      })
      
      setPredictions(result)
      toast.success(`Forecast generated for ${selectedProducts.length} products`)
    } catch (error) {
      console.error('Forecast error:', error)
      setError(error.response?.data?.error || 'Failed to generate forecast')
      setPredictions(null)
    } finally {
      setLoading(false)
    }
  }

  const getTotalPredictedDemand = () => {
    if (!predictions?.predictions) return 0
    return Object.values(predictions.predictions).reduce((sum, pred) => sum + (pred.total_forecast || 0), 0)
  }

  const getAverageDailyDemand = () => {
    if (!predictions?.predictions) return 0
    const total = getTotalPredictedDemand()
    return total / daysAhead / Object.keys(predictions.predictions).length
  }

  const getPeakProduct = () => {
    if (!predictions?.predictions) return { name: 'N/A', demand: 0 }
    
    let peakProduct = { name: 'N/A', demand: 0 }
    Object.entries(predictions.predictions).forEach(([productId, pred]) => {
      if (pred.total_forecast > peakProduct.demand) {
        peakProduct = {
          name: pred.product_name || productId,
          demand: pred.total_forecast
        }
      }
    })
    
    return peakProduct
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
          Demand Forecasting
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Generate intelligent demand predictions using machine learning to optimize your inventory planning and reduce stockouts.
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className=" p-6 mb-8 overflow-visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
          {/* Product Selection */}
        <div className="lg:col-span-2 relative overflow-visible">
        <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Products
        </label>
        <ProductSelector
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
            disabled={loading}
        />
        </div>

          {/* Days Ahead */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Forecast Period
            </label>
            <select
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              disabled={loading}
              className="w-full glass-card p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-400/50 disabled:opacity-50"
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          {/* Generate Button */}
          <div>
            <button
              onClick={handleGenerateForecast}
              disabled={loading || selectedProducts.length === 0}
              className="w-full primary-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Forecasting...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Generate Forecast</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {predictions && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Products Analyzed"
            value={predictions.total_products || 0}
            subtitle="Forecast generated for"
            icon={TrendingUp}
            color="primary"
            index={0}
          />
          
          <SummaryCard
            title="Total Demand"
            value={getTotalPredictedDemand().toFixed(0)}
            subtitle={`Over ${daysAhead} days`}
            icon={BarChart3}
            color="green"
            index={1}
          />
          
          <SummaryCard
            title="Avg Daily per Product"
            value={getAverageDailyDemand().toFixed(1)}
            subtitle="Units per day"
            icon={Calendar}
            color="blue"
            index={2}
          />
          
          <SummaryCard
            title="Peak Product"
            value={getPeakProduct().demand.toFixed(0)}
            subtitle={getPeakProduct().name}
            icon={TrendingUp}
            color="purple"
            index={3}
          />
        </div>
      )}

      {/* Chart Type Selector */}
      {predictions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="glass-card p-2 flex space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                chartType === 'line'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <LineChart className="h-4 w-4" />
              <span>Line Chart</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                chartType === 'bar'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Bar Chart</span>
            </button>
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
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Forecast Generation Failed</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={handleGenerateForecast}
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
          <h3 className="text-lg font-semibold text-white mb-2">Generating Forecast</h3>
          <p className="text-gray-300">
            Analyzing historical data and generating predictions for {selectedProducts.length} products...
          </p>
          <div className="mt-6 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      )}

      {/* Forecast Results */}
      <AnimatePresence>
        {predictions?.predictions && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {Object.entries(predictions.predictions).map(([productId, predictionData], index) => (
                <ForecastChart
                  key={productId}
                  data={predictionData}
                  productName={predictionData.product_name || productId}
                  chartType={chartType}
                />
              ))}
            </div>

            {/* Forecast Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-400" />
                Forecast Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-gray-300 mb-1">Forecast Period</div>
                  <div className="text-white font-medium">{predictions.forecast_period}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-gray-300 mb-1">Total Products</div>
                  <div className="text-white font-medium">{predictions.total_products}</div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-gray-300 mb-1">Generated On</div>
                  <div className="text-white font-medium">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!predictions && !loading && !error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center"
        >
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-white mb-4">Ready to Generate Forecasts</h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Select products and forecast period above, then click "Generate Forecast" to see intelligent demand predictions.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
              <span>ML-powered predictions</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Historical data analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Interactive visualizations</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ForecastPage