import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Upload, TrendingUp, Package, BarChart3, Activity } from 'lucide-react'

import UploadPage from './pages/UploadPage'
import ForecastPage from './pages/ForecastPage'
import StockPlanPage from './pages/StockPlanPage'
import AnalyticsPage from './pages/AnalyticsPage'

const navigation = [
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Forecast', href: '/forecast', icon: TrendingUp },
  { name: 'Stock Plan', href: '/stock-plan', icon: Package },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
            },
          }}
        />

        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <motion.div 
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Activity className="h-8 w-8 text-primary-400" />
                  <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                    DemandIQ
                  </span>
                </motion.div>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? 'text-primary-400 border-b-2 border-primary-400'
                            : 'text-gray-300 hover:text-white hover:border-gray-300 border-b-2 border-transparent'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `block pl-3 pr-4 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? 'text-primary-400 bg-primary-900/20 border-r-4 border-primary-400'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/upload" replace />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/stock-plan" element={<StockPlanPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </Router>
  )
}

export default App