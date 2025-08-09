import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, Loader2, AlertCircle, Database } from 'lucide-react'
import toast from 'react-hot-toast'

import FileUploader from '../components/FileUploader'
import SummaryCard from '../components/SummaryCard'
import { uploadFiles } from '../api/upload'

const UploadPage = () => {
  const [files, setFiles] = useState({})
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const handleFilesChange = (newFiles) => {
    setFiles(newFiles)
    // Reset upload result when files change
    if (uploadResult) {
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (Object.keys(files).length === 0) {
      toast.error('Please select at least one file to upload')
      return
    }

    setUploading(true)
    try {
      const result = await uploadFiles(files)
      setUploadResult(result)
      toast.success('Files uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult(null)
    } finally {
      setUploading(false)
    }
  }

  const getTotalRows = () => {
    if (!uploadResult?.uploaded_files) return 0
    return Object.values(uploadResult.uploaded_files).reduce((sum, file) => sum + (file.rows || 0), 0)
  }

  const getFileCount = () => {
    return Object.keys(files).length
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
          Data Upload Center
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Upload your sales, product, and weather data to start generating intelligent demand forecasts and optimize your inventory planning.
        </p>
      </motion.div>

      {/* Upload Status Cards */}
      {(uploadResult || getFileCount() > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SummaryCard
            title="Files Selected"
            value={getFileCount()}
            subtitle="Ready for upload"
            icon={Database}
            color="blue"
            index={0}
          />
          
          {uploadResult && (
            <>
              <SummaryCard
                title="Files Uploaded"
                value={Object.keys(uploadResult.uploaded_files || {}).length}
                subtitle="Successfully processed"
                icon={CheckCircle}
                color="green"
                index={1}
              />
              
              <SummaryCard
                title="Total Records"
                value={getTotalRows()}
                subtitle="Data points available"
                icon={Upload}
                color="primary"
                index={2}
              />
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Upload Section */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <Upload className="h-6 w-6 mr-3 text-primary-400" />
              Upload Data Files
            </h2>
            
            <FileUploader 
              onFilesChange={handleFilesChange}
              acceptedFiles={files}
            />
            
            {/* Upload Button */}
            {Object.keys(files).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-center"
              >
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="primary-button disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading Files...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      <span>Upload Files</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Instructions & Status */}
        <div className="space-y-6">
          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
              Upload Instructions
            </h3>
            
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-2">File Requirements:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Files must be in CSV format</li>
                  <li>• Maximum file size: 16MB</li>
                  <li>• UTF-8 encoding recommended</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-white mb-2">Required Columns:</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-primary-400 font-medium">Sales Data:</span>
                    <p className="ml-2 text-xs">date, product_id, quantity_sold, day_of_week, promotion</p>
                  </div>
                  <div>
                    <span className="text-primary-400 font-medium">Products Data:</span>
                    <p className="ml-2 text-xs">product_id, product_name, shelf_life_days, category</p>
                  </div>
                  <div>
                    <span className="text-primary-400 font-medium">Weather Data:</span>
                    <p className="ml-2 text-xs">date, temperature, humidity, precipitation</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upload Result */}
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 border-green-500/20 bg-green-500/5"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                Upload Complete
              </h3>
              
              <div className="space-y-3">
                {Object.entries(uploadResult.uploaded_files || {}).map(([fileType, fileInfo]) => (
                  <div key={fileType} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white capitalize">
                        {fileType} Data
                      </span>
                      <span className="text-sm text-gray-300">
                        {fileInfo.rows?.toLocaleString()} rows
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Columns: {fileInfo.columns?.join(', ')}
                    </div>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-white/10">
                  <p className="text-sm text-green-400 font-medium">
                    Ready for forecasting and planning!
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    You can now use the Forecast and Stock Plan features.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Next Steps */}
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Next Steps
              </h3>
              
              <div className="space-y-3">
                <a
                  href="/forecast"
                  className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-400/10 rounded-lg group-hover:bg-primary-400/20 transition-colors">
                      <Database className="h-4 w-4 text-primary-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Generate Forecasts</div>
                      <div className="text-xs text-gray-400">Predict demand for your products</div>
                    </div>
                  </div>
                </a>
                
                <a
                  href="/stock-plan"
                  className="block bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-400/10 rounded-lg group-hover:bg-green-400/20 transition-colors">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Create Stock Plan</div>
                      <div className="text-xs text-gray-400">Optimize inventory with shelf life awareness</div>
                    </div>
                  </div>
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadPage