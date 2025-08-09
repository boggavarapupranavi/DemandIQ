import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Calendar, Package } from 'lucide-react'

const ForecastChart = ({ data, productName, chartType = 'line' }) => {
  if (!data || !data.daily_forecast || !data.forecast_dates) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 text-center"
      >
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">No forecast data available</p>
      </motion.div>
    )
  }

  // Prepare chart data
  const chartData = data.forecast_dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    demand: data.daily_forecast[index] || 0,
    fullDate: date
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white/20">
          <p className="text-white font-medium">{`Date: ${label}`}</p>
          <p className="text-primary-400">
            {`Demand: ${payload[0].value.toFixed(1)} units`}
          </p>
        </div>
      )
    }
    return null
  }

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-400" />
            Demand Forecast
          </h3>
          <p className="text-sm text-gray-300 mt-1">
            {productName || 'Product Forecast'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {data.total_forecast?.toFixed(1) || '0'}
          </div>
          <div className="text-sm text-gray-300">Total Units</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Avg Daily</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {data.avg_daily_demand?.toFixed(1) || '0'} units
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Peak Day</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {Math.max(...(data.daily_forecast || [0])).toFixed(1)} units
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            {chartType === 'bar' ? (
              <Bar 
                dataKey="demand" 
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <Line 
                type="monotone" 
                dataKey="demand" 
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2, fill: '#fff' }}
              />
            )}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      {/* Forecast Period */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm text-gray-300">
          <span>Forecast Period</span>
          <span>
            {data.forecast_dates?.length || 0} days 
            ({data.forecast_dates?.[0]} to {data.forecast_dates?.[data.forecast_dates?.length - 1]})
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default ForecastChart