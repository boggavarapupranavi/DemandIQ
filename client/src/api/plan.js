import api from './config'

export const createStockPlan = async (params = {}) => {
  try {
    const payload = {
      product_ids: params.productIds || null, // null means use all products
      planning_horizon: params.planningHorizon || 7,
    }

    const response = await api.post('/plan', payload, {
      timeout: 45000, // Longer timeout for optimization
    })

    return response.data
  } catch (error) {
    throw error
  }
}