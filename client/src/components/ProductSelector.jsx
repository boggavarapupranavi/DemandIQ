import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Search, Package, Loader2 } from 'lucide-react'
import { getProducts } from '../api/products'
import toast from 'react-hot-toast'

const ProductSelector = ({ selectedProducts = [], onProductsChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectAll, setSelectAll] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    // Update selectAll state based on selection
    if (products.length > 0) {
      setSelectAll(selectedProducts.length === products.length)
    }
  }, [selectedProducts, products])

  const fetchProducts = async () => {
    if (disabled) return
    
    setLoading(true)
    try {
      const response = await getProducts()
      setProducts(response.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      // Don't show error toast if it's just because files aren't uploaded yet
      if (!error.response?.status === 404) {
        toast.error('Failed to load products')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleProductToggle = (product) => {
    const isSelected = selectedProducts.includes(product)
    let newSelection

    if (isSelected) {
      newSelection = selectedProducts.filter(p => p !== product)
    } else {
      newSelection = [...selectedProducts, product]
    }

    onProductsChange(newSelection)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      onProductsChange([])
    } else {
      onProductsChange([...filteredProducts])
    }
  }

  const getDisplayText = () => {
    if (selectedProducts.length === 0) {
      return 'Select products...'
    } else if (selectedProducts.length === 1) {
      return selectedProducts[0]
    } else if (selectedProducts.length <= 3) {
      return selectedProducts.join(', ')
    } else {
      return `${selectedProducts.length} products selected`
    }
  }

  return (
    <>
      {/* Main container with proper z-index when open */}
      <div className={`relative ${isOpen ? 'z-9999' : 'z-auto'}`}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full glass-card p-4 flex items-center justify-between transition-all duration-300 ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-white/20 cursor-pointer'
          } ${isOpen ? 'ring-2 ring-primary-400/50' : ''}`}
        >
          <div className="flex items-center space-x-3">
            <Package className="h-5 w-5 text-gray-300" />
            <span className={`${selectedProducts.length > 0 ? 'text-white' : 'text-gray-400'}`}>
              {getDisplayText()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            <ChevronDown 
              className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 glass-card max-h-80 overflow-auto z-9999"
            >
              {/* Search */}
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>
              </div>

              {/* Select All */}
              {filteredProducts.length > 0 && (
                <div className="p-3 border-b border-white/10">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-3 w-full text-left hover:bg-white/5 p-2 rounded-lg transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      selectAll
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-white/30 hover:border-white/50'
                    }`}>
                      {selectAll && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      Select All ({filteredProducts.length})
                    </span>
                  </button>
                </div>
              )}

              {/* Product List */}
              <div className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    {searchTerm ? 'No products found' : 'No products available'}
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredProducts.map((product, index) => {
                      const isSelected = selectedProducts.includes(product)
                      return (
                        <motion.button
                          key={product}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                          onClick={() => handleProductToggle(product)}
                          className="flex items-center space-x-3 w-full text-left hover:bg-white/5 p-2 rounded-lg transition-colors"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-white/30 hover:border-white/50'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm text-white truncate flex-1">
                            {product}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedProducts.length > 0 && (
                <div className="p-3 border-t border-white/10 bg-white/5">
                  <p className="text-xs text-gray-400">
                    {selectedProducts.length} of {products.length} products selected
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-999"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default ProductSelector