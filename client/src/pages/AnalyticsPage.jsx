import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Database, TrendingUp, Package, Loader2, AlertCircle, PieChart, Users } from 'lucide-react'
import {
  PieChart as RechartsPieChart,
  Pie, 
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

import SummaryCard from '../components/SummaryCard'
import { getProductStats } from '../api/products'

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProductStats()
  }, [])

  const fetchProductStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await getProductStats()
      setStats(response.statistics)
    } catch (error) {
      console.error('Stats error:', error)
      setError(error.response?.data?.error || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryData = () => {
    if (!stats?.category_distribution) return []
    
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16']
    
    return Object.entries(stats.category_distribution).map(([category, count], index) => ({
      name: category || 'Unknown',
      value: count,
      color: colors[index % colors.length]
    }))
  }

  const getMissingDataChart = () => {
    if (!stats?.missing_values) return []
    
    return Object.entries(stats.missing_values)
      .filter(([_, count]) => count > 0)
      .map(([column, count]) => ({
        column: column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        missing: count,
        percentage: ((count / stats.total_products) * 100).toFixed(1)
      }))
      .sort((a, b) => b.missing - a.missing)
  }

  const getDataTypesSummary = () => {
    if (!stats?.data_types) return []
    
    const typeGroups = {}
    Object.entries(stats.data_types).forEach(([column, type]) => {
      const normalizedType = type.includes('int') ? 'Integer' : 
                           type.includes('float') ? 'Float' : 
                           type.includes('object') ? 'Text' : 
                           type.includes('datetime') ? 'Date' : 'Other'
      
      typeGroups[normalizedType] = (typeGroups[normalizedType] || 0) + 1
    })
    
    return Object.entries(typeGroups).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / Object.keys(stats.data_types).length) * 100).toFixed(1)
    }))
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white/20">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="glass-card p-3 border border-white/20">
          <p className="text-white font-medium">{data.name}</p>
          <p style={{ color: data.payload.color }}>
            {`Count: ${data.value}`}
          </p>
          <p className="text-gray-300 text-sm">
            {`${((data.value / stats.total_products) * 100).toFixed(1)}%`}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="glass-card p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Loading Analytics</h3>
          <p className="text-gray-300">Analyzing your product data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="glass-card p-12 text-center border-red-500/20 bg-red-500/5">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Analytics Unavailable</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchProductStats}
            className="glass-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
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
          Data Analytics Dashboard
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Comprehensive insights into your product data, data quality metrics, and statistical analysis.
        </p>
      </motion.div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Products"
            value={stats.total_products || 0}
            subtitle="Products in database"
            icon={Package}
            color="primary"
            index={0}
          />
          
          <SummaryCard
            title="Data Columns"
            value={stats.columns?.length || 0}
            subtitle="Available attributes"
            icon={Database}
            color="blue"
            index={1}
          />
          
          <SummaryCard
            title="Categories"
            value={Object.keys(stats.category_distribution || {}).length}
            subtitle="Product categories"
            icon={Users}
            color="green"
            index={2}
          />
          
          <SummaryCard
            title="Data Quality"
            value={`${Math.max(0, 100 - (Object.values(stats.missing_values || {}).reduce((a, b) => a + b, 0) / stats.total_products * 100)).toFixed(0)}%`}
            subtitle="Completeness score"
            icon={TrendingUp}
            color={Object.values(stats.missing_values || {}).reduce((a, b) => a + b, 0) === 0 ? 'green' : 'orange'}
            index={3}
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Category Distribution */}
        {getCategoryData().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-primary-400" />
              Category Distribution
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={getCategoryData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {getCategoryData().map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-300 truncate">{item.name}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Data Quality Analysis */}
        {getMissingDataChart().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
              Data Quality Issues
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMissingDataChart()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="column" 
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.6)"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="missing" 
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Data Schema Overview */}
      {stats && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Column Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary-400" />
              Data Schema
            </h3>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.columns?.map((column, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{column}</span>
                    <span className="text-sm text-gray-300">
                      {stats.data_types?.[column] || 'Unknown'}
                    </span>
                  </div>
                  {stats.missing_values?.[column] > 0 && (
                    <div className="mt-1 text-xs text-orange-400">
                      {stats.missing_values[column]} missing values
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Types Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary-400" />
              Data Types Summary
            </h3>
            
            <div className="space-y-4">
              {getDataTypesSummary().map((item, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{item.type}</span>
                    <span className="text-sm text-gray-300">{item.count} columns</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{item.percentage}% of columns</div>
                </div>
              ))}
            </div>

            {/* Data Insights */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Data Insights</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Total Records</span>
                  <span className="text-white font-medium">{stats.total_products?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Complete Records</span>
                  <span className="text-green-400 font-medium">
                    {stats.total_products - Object.values(stats.missing_values || {}).reduce((a, b) => Math.max(a, b), 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Completeness</span>
                  <span className={`font-medium ${
                    Object.values(stats.missing_values || {}).reduce((a, b) => a + b, 0) === 0 
                      ? 'text-green-400' 
                      : 'text-orange-400'
                  }`}>
                    {Math.max(0, 100 - (Object.values(stats.missing_values || {}).reduce((a, b) => a + b, 0) / stats.total_products * 100)).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage