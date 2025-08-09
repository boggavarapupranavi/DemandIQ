import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

const ChartCard = ({ 
  title, 
  description, 
  children, 
  className = '',
  headerExtra = null,
  loading = false,
  collapsible = false,
  expandable = false,
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const toggleExpand = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    }
  };

  const cardClasses = `
    bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200
    ${isExpanded ? 'fixed inset-4 z-50 overflow-auto' : ''}
    ${className}
  `;

  const contentHeight = isCollapsed ? 'h-0 overflow-hidden' : 'h-auto';

  return (
    <div className={cardClasses}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div 
            className={`flex-1 ${collapsible ? 'cursor-pointer' : ''}`}
            onClick={toggleCollapse}
          >
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {collapsible && (
                <button className="text-gray-400 hover:text-gray-600">
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {description && !isCollapsed && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {headerExtra && (
              <div className="flex-shrink-0">
                {headerExtra}
              </div>
            )}
            
            {expandable && (
              <button
                onClick={toggleExpand}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className={`transition-all duration-300 ${contentHeight}`}>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <span className="ml-2 text-gray-600 mt-2 block">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="chart-container">
              {children}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for expanded mode */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleExpand}
        />
      )}
    </div>
  );
};

// Higher-order component for responsive charts
export const ResponsiveChartCard = ({ 
  title, 
  description, 
  children, 
  minHeight = '300px',
  ...props 
}) => {
  return (
    <ChartCard 
      title={title} 
      description={description} 
      expandable={true}
      {...props}
    >
      <div style={{ minHeight, width: '100%' }}>
        {children}
      </div>
    </ChartCard>
  );
};

// Specialized chart card for metrics
export const MetricChartCard = ({ 
  title, 
  value, 
  change, 
  children, 
  color = 'primary',
  ...props 
}) => {
  const colorClasses = {
    primary: 'text-primary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600'
  };

  const headerExtra = (
    <div className="text-right">
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      {change !== undefined && (
        <p className={`text-sm ${
          change >= 0 ? 'text-success-600' : 'text-danger-600'
        }`}>
          {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
        </p>
      )}
    </div>
  );

  return (
    <ChartCard 
      title={title} 
      headerExtra={headerExtra}
      {...props}
    >
      {children}
    </ChartCard>
  );
};

export default ChartCard;
