'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface GrowthMilestone {
  id: string
  dog_id: string
  milestone_date: string
  milestone_type: string
  title: string
  description?: string
  photo_urls?: string[]
  created_at: string
}

interface GrowthMilestonesProps {
  selectedDogId: string
}

const MILESTONE_TYPES = [
  { value: 'first_walk', label: '首次行走', icon: '🚶', color: 'bg-blue-100 text-blue-800' },
  { value: 'first_solid_food', label: '第一次固体食物', icon: '🍼', color: 'bg-green-100 text-green-800' },
  { value: 'first_vaccination', label: '首次疫苗', icon: '💉', color: 'bg-red-100 text-red-800' },
  { value: 'first_bath', label: '第一次洗澡', icon: '🛁', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'first_training', label: '首次训练', icon: '🎾', color: 'bg-orange-100 text-orange-800' },
  { value: 'lose_baby_teeth', label: '换牙期', icon: '🦷', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'first_heat', label: '首次发情', icon: '❤️', color: 'bg-pink-100 text-pink-800' },
  { value: 'first_mating', label: '首次配种', icon: '👫', color: 'bg-purple-100 text-purple-800' },
  { value: 'achievement', label: '成就奖项', icon: '🏆', color: 'bg-amber-100 text-amber-800' },
  { value: 'behavior', label: '行为里程碑', icon: '🧠', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'health', label: '健康里程碑', icon: '❤️‍🩹', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'other', label: '其他', icon: '⭐', color: 'bg-gray-100 text-gray-800' }
]

export default function GrowthMilestones({ selectedDogId }: GrowthMilestonesProps) {
  const [milestones, setMilestones] = useState<GrowthMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<GrowthMilestone | null>(null)

  useEffect(() => {
    fetchMilestones()
  }, [selectedDogId])

  const fetchMilestones = async () => {
    try {
      let query = supabase
        .from('growth_milestones')
        .select('*')
        .order('milestone_date', { ascending: false })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      const { data, error } = await query
      if (error) throw error
      setMilestones(data || [])
    } catch (error) {
      console.error('获取成长里程碑失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个里程碑吗？')) return

    try {
      const { error } = await supabase
        .from('growth_milestones')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchMilestones()
    } catch (error) {
      console.error('删除里程碑失败:', error)
      alert('删除失败，请重试')
    }
  }

  const getMilestoneTypeInfo = (type: string) => {
    return MILESTONE_TYPES.find(t => t.value === type) || MILESTONE_TYPES[MILESTONE_TYPES.length - 1]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-64"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">成长里程碑</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '记录狗狗成长过程中的重要时刻' : '所有狗狗的成长里程碑'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加里程碑</span>
        </button>
      </div>

      {/* 里程碑列表 */}
      {milestones.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无成长里程碑
          </h3>
          <p className="text-gray-500 mb-6">
            记录狗狗成长过程中的重要时刻
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            添加里程碑
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 时间轴样式展示 */}
          <div className="relative">
            {milestones.map((milestone, index) => {
              const typeInfo = getMilestoneTypeInfo(milestone.milestone_type)
              return (
                <div key={milestone.id} className="relative pb-8">
                  {/* 时间轴线 */}
                  {index < milestones.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200"></div>
                  )}
                  
                  <div className="relative flex items-start space-x-4">
                    {/* 时间轴节点 */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-lg ${typeInfo.color.replace('text-', 'bg-').replace('-800', '-500')}`}>
                      <span className="text-white">{typeInfo.icon}</span>
                    </div>
                    
                    {/* 里程碑内容 */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {milestone.title}
                            </h3>
                            <span className={`px-3 py-1 text-sm rounded-full ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-3">
                            {formatDate(milestone.milestone_date)}
                          </p>
                          
                          {milestone.description && (
                            <p className="text-gray-700 mb-4">
                              {milestone.description}
                            </p>
                          )}
                          
                          {/* 照片展示 */}
                          {milestone.photo_urls && milestone.photo_urls.length > 0 && (
                            <div className="mb-4">
                              <div className="flex flex-wrap gap-2">
                                {milestone.photo_urls.map((url, photoIndex) => (
                                  <div key={photoIndex} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={url}
                                      alt={`里程碑照片 ${photoIndex + 1}`}
                                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                      onClick={() => window.open(url, '_blank')}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setEditingMilestone(milestone)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="编辑"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(milestone.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="删除"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 添加/编辑里程碑模态框 */}
      {(showAddModal || editingMilestone) && (
        <AddMilestoneModal
          milestone={editingMilestone}
          selectedDogId={selectedDogId}
          onClose={() => {
            setShowAddModal(false)
            setEditingMilestone(null)
          }}
          onSuccess={() => {
            fetchMilestones()
            setShowAddModal(false)
            setEditingMilestone(null)
          }}
        />
      )}
    </div>
  )
}

// 添加里程碑模态框组件
function AddMilestoneModal({ 
  milestone, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  milestone: GrowthMilestone | null
  selectedDogId: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    dog_id: milestone?.dog_id || selectedDogId || '',
    milestone_date: milestone?.milestone_date || new Date().toISOString().split('T')[0],
    milestone_type: milestone?.milestone_type || '',
    title: milestone?.title || '',
    description: milestone?.description || '',
    photo_urls: milestone?.photo_urls?.join(', ') || ''
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    if (!milestone) {
      fetchDogs()
    }
  }, [milestone])

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed')
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取狗狗列表失败:', error)
    }
  }

  // 文件处理函数
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const validFiles: File[] = []
    const newPreviewUrls: string[] = []

    Array.from(files).forEach(file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert(`文件 ${file.name} 不是有效的图片格式`)
        return
      }

      // 检查文件大小（5MB限制）
      if (file.size > 5 * 1024 * 1024) {
        alert(`文件 ${file.name} 大小超过5MB限制`)
        return
      }

      validFiles.push(file)
      newPreviewUrls.push(URL.createObjectURL(file))
    })

    setSelectedFiles(prev => [...prev, ...validFiles])
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index)
      // 清理旧的预览URL
      URL.revokeObjectURL(prev[index])
      return newUrls
    })
  }

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return []
    
    setUploading(true)
    const urls: string[] = []

    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `growth-milestones/${fileName}`

        const { data, error } = await supabase.storage
          .from('dog-photos')
          .upload(filePath, file)

        if (error) {
          console.error('上传文件失败:', error)
          alert(`上传文件 ${file.name} 失败: ${error.message}`)
          continue
        }

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
          .from('dog-photos')
          .getPublicUrl(filePath)

        urls.push(publicUrl)
      }
    } catch (error) {
      console.error('批量上传失败:', error)
      alert('上传失败，请重试')
    } finally {
      setUploading(false)
    }

    return urls
  }

  // 拖拽处理函数
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('请先登录')
        return
      }

      let photoUrls: string[] = []

      // 如果有新上传的文件，先上传文件
      if (selectedFiles.length > 0) {
        const uploadedUrls = await uploadFiles()
        photoUrls = [...photoUrls, ...uploadedUrls]
      }

      // 处理原有的照片URL
      if (formData.photo_urls) {
        const existingUrls = formData.photo_urls
          .split(',')
          .map(url => url.trim())
          .filter(url => url)
        photoUrls = [...photoUrls, ...existingUrls]
      }

      const submitData = {
        user_id: user.id,
        dog_id: formData.dog_id,
        milestone_date: formData.milestone_date,
        milestone_type: formData.milestone_type,
        title: formData.title,
        description: formData.description || null,
        photo_urls: photoUrls.length > 0 ? photoUrls : null
      }

      if (milestone) {
        // 更新现有里程碑
        const { error } = await supabase
          .from('growth_milestones')
          .update(submitData)
          .eq('id', milestone.id)

        if (error) throw error
      } else {
        // 创建新里程碑
        const { error } = await supabase
          .from('growth_milestones')
          .insert([submitData])

        if (error) throw error
      }

      // 清理预览URL
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      
      onSuccess()
    } catch (error) {
      console.error('保存里程碑失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {milestone ? '编辑里程碑' : '添加里程碑'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!milestone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择狗狗 *
              </label>
              <select
                value={formData.dog_id}
                onChange={(e) => setFormData(prev => ({ ...prev, dog_id: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">请选择狗狗</option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name} - {dog.breed}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              里程碑日期 *
            </label>
            <input
              type="date"
              value={formData.milestone_date}
              onChange={(e) => setFormData(prev => ({ ...prev, milestone_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              里程碑类型 *
            </label>
            <select
              value={formData.milestone_type}
              onChange={(e) => setFormData(prev => ({ ...prev, milestone_type: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">请选择类型</option>
              {MILESTONE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              里程碑标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="例如：第一次自己吃饭"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述（可选）
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="详细描述这个里程碑的情况..."
            />
          </div>

          {/* 图片上传区域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上传照片（可选）
            </label>
            
            {/* 拖拽上传区域 */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-2">
                <div className="text-4xl">📸</div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-purple-600">点击选择图片</span>
                  <span className="text-gray-500"> 或拖拽图片到此处</span>
                </div>
                <div className="text-xs text-gray-500">
                  支持 JPG、PNG、WebP、GIF 格式，最大 5MB，可选择多张
                </div>
              </div>
            </div>

            {/* 图片预览 */}
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`预览 ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 备用URL输入（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              或输入图片链接（可选）
            </label>
            <input
              type="text"
              value={formData.photo_urls}
              onChange={(e) => setFormData(prev => ({ ...prev, photo_urls: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="多个链接用逗号分隔"
            />
            <p className="text-xs text-gray-500 mt-1">
              如果不上传文件，可以直接输入图片URL链接，多个链接用逗号分隔
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '上传中...' : loading ? '保存中...' : (milestone ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 