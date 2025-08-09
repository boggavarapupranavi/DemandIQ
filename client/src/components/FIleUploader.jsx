import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

const FileUploader = ({ onFilesChange, acceptedFiles = {} }) => {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState({})

  const fileTypes = [
    { key: 'sales', label: 'Sales Data', description: 'Historical sales transactions', required: true },
    { key: 'products', label: 'Products Data', description: 'Product information and shelf life', required: true },
    { key: 'weather', label: 'Weather Data', description: 'Weather conditions (optional)', required: false },
  ]

  const validateFile = (file, type) => {
    const maxSize = 16 * 1024 * 1024 // 16MB
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel']
    
    if (file.size > maxSize) {
      toast.error(`${type} file is too large. Maximum size is 16MB.`)
      return false
    }
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error(`${type} file must be a CSV file.`)
      return false
    }
    
    return true
  }

  const handleFiles = useCallback((newFiles, type) => {
    const file = newFiles[0]
    if (!file) return

    if (!validateFile(file, type)) return

    const updatedFiles = { ...files, [type]: file }
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
    toast.success(`${type} file uploaded successfully!`)
  }, [files, onFilesChange])

  const removeFile = (type) => {
    const updatedFiles = { ...files }
    delete updatedFiles[type]
    setFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e, type) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files, type)
    }
  }, [handleFiles])

  return (
    <div className="space-y-6">
      {fileTypes.map((fileType, index) => (
        <motion.div
          key={fileType.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center">
                {fileType.label}
                {fileType.required && <span className="text-red-400 ml-1">*</span>}
              </h3>
              <p className="text-sm text-gray-300">{fileType.description}</p>
            </div>
            {files[fileType.key] && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-5 w-5 text-green-400" />
                <button
                  onClick={() => removeFile(fileType.key)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {!files[fileType.key] ? (
              <motion.div
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                  dragActive
                    ? 'border-primary-400 bg-primary-400/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, fileType.key)}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleFiles(e.target.files, fileType.key)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-white mb-2">
                    Drop your {fileType.label.toLowerCase()} here
                  </p>
                  <p className="text-sm text-gray-300 mb-4">
                    or click to browse files
                  </p>
                  <div className="glass-button inline-flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Choose File</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 rounded-xl p-4"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-8 w-8 text-green-400" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{files[fileType.key].name}</p>
                    <p className="text-sm text-gray-300">
                      {(files[fileType.key].size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {Object.keys(files).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <AlertCircle className="h-4 w-4" />
            <span>Files ready for upload. Click "Upload Files" to proceed.</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default FileUploader