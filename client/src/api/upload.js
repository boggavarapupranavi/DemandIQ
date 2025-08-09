import api from './config'

export const uploadFiles = async (files) => {
  try {
    const formData = new FormData()
    
    // Add files to FormData
    Object.keys(files).forEach(fileType => {
      if (files[fileType]) {
        formData.append(fileType, files[fileType])
      }
    })

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Longer timeout for file uploads
    })

    return response.data
  } catch (error) {
    throw error
  }
}

export const checkHealth = async () => {
  try {
    const response = await api.get('/health', {
      skipErrorToast: true
    })
    return response.data
  } catch (error) {
    throw error
  }
}