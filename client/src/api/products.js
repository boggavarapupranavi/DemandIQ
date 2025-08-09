import api from './config'

export const getProducts = async () => {
  try {
    const response = await api.get('/products')
    return response.data
  } catch (error) {
    throw error
  }
}

export const getProductInfo = async (productId) => {
  try {
    const response = await api.get(`/products/${productId}/info`)
    return response.data
  } catch (error) {
    throw error
  }
}

export const getProductStats = async () => {
  try {
    const response = await api.get('/products/stats')
    return response.data
  } catch (error) {
    throw error
  }
}