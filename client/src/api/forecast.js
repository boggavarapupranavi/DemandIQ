import api from './config'

export const predictDemand = async (params = {}) => {
  try {
    const payload = {
      product_ids: params.productIds || [],
      days_ahead: params.daysAhead || 7,
    }

    const response = await api.post('/predict', payload, {
      timeout: 45000, // Longer timeout for ML predictions
    })

    return response.data
  } catch (error) {
    throw error
  }
}