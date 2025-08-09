import { motion } from 'framer-motion'

const SummaryCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'primary',
  loading = false,
  index = 0 
}) => {
  const getColorClasses = (colorName) => {
    const colors = {
      primary: 'text-primary-400 bg-primary-400/10',
      green: 'text-green-400 bg-green-400/10',
      orange: 'text-orange-400 bg-orange-400/10',
      red: 'text-red-400 bg-red-400/10',
      purple: 'text-purple-400 bg-purple-400/10',
      blue: 'text-blue-400 bg-blue-400/10',
    }
    return colors[colorName] || colors.primary
  }

  const getTrendColor = (trendType) => {
    switch (trendType) {
      case 'up': return 'text-green-400'
      case 'down': return 'text-red-400'
      case 'neutral': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`
      return val.toLocaleString()
    }
    return val
  }

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-white/10 rounded w-24"></div>
          <div className="h-8 w-8 bg-white/10 rounded-lg"></div>
        </div>
        <div className="h-8 bg-white/10 rounded w-16 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-32"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-card p-6 hover:bg-white/15 transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
          {title}
        </h3>
        {Icon && (
          <div className={`p-2 rounded-lg ${getColorClasses(color)} group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-2xl font-bold text-white">
          {formatValue(value)}
        </div>

        {subtitle && (
          <p className="text-sm text-gray-400">
            {subtitle}
          </p>
        )}

        {trend && trendValue && (
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
              {trend === 'up' && '↗'}
              {trend === 'down' && '↘'}
              {trend === 'neutral' && '→'}
              {trendValue}
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default SummaryCard