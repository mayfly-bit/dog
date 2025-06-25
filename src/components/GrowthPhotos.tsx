'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface GrowthPhoto {
  id: string
  dog_id: string
  photo_date: string
  photo_url: string
  caption?: string
  age_in_days?: number
  created_at: string
}

interface GrowthPhotosProps {
  selectedDogId: string
}

export default function GrowthPhotos({ selectedDogId }: GrowthPhotosProps) {
  const [photos, setPhotos] = useState<GrowthPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<GrowthPhoto | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<GrowthPhoto | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [selectedDogId])

  const fetchPhotos = async () => {
    try {
      let query = supabase
        .from('growth_photos')
        .select('*')
        .order('photo_date', { ascending: false })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      const { data, error } = await query
      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('获取成长照片失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这张照片吗？')) return

    try {
      const { error } = await supabase
        .from('growth_photos')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPhotos()
    } catch (error) {
      console.error('删除照片失败:', error)
      alert('删除失败，请重试')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatAge = (ageInDays?: number) => {
    if (!ageInDays) return ''
    
    if (ageInDays < 30) {
      return `${ageInDays} 天大`
    } else if (ageInDays < 365) {
      return `${Math.floor(ageInDays / 30)} 个月大`
    } else {
      const years = Math.floor(ageInDays / 365)
      const months = Math.floor((ageInDays % 365) / 30)
      return `${years} 岁 ${months} 个月大`
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <h2 className="text-xl font-semibold text-gray-900">成长照片</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '记录狗狗成长过程中的珍贵瞬间' : '所有狗狗的成长照片'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加照片</span>
        </button>
      </div>

      {/* 照片网格 */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无成长照片
          </h3>
          <p className="text-gray-500 mb-6">
            开始记录狗狗的成长瞬间吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            添加第一张照片
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg transition-shadow group">
              {/* 照片 */}
              <div className="relative aspect-square">
                <img
                  src={photo.photo_url}
                  alt={photo.caption || '成长照片'}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedPhoto(photo)}
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NS4xIDk4Ljk5OTlMNzAuMSA4My45OTk5SDYwLjFWMTI2SDEzOS45VjgzLjk5OTlIMTI5LjlMMTE0LjkgOTguOTk5OUwxMDAuOSA4NC45OTk5TDEwMS45IDgzLjk5OTlIODAuMUw4NS4xIDg4Ljk5OTlWOTguOTk5OVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                  }}
                />
                
                {/* 操作按钮 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingPhoto(photo)
                      }}
                      className="p-1.5 bg-white/80 hover:bg-white rounded-full text-blue-600 hover:text-blue-800 transition-colors"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(photo.id)
                      }}
                      className="p-1.5 bg-white/80 hover:bg-white rounded-full text-red-600 hover:text-red-800 transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 照片信息 */}
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-1">
                  {formatDate(photo.photo_date)}
                  {photo.age_in_days && (
                    <span className="ml-2 text-xs bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                      {formatAge(photo.age_in_days)}
                    </span>
                  )}
                </div>
                {photo.caption && (
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {photo.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 照片预览模态框 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
            >
              ✕
            </button>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || '成长照片'}
              className="max-w-full max-h-[90vh] object-contain"
            />
            {selectedPhoto.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-4">
                <p className="text-center">{selectedPhoto.caption}</p>
                <p className="text-center text-sm text-gray-300 mt-1">
                  {formatDate(selectedPhoto.photo_date)}
                  {selectedPhoto.age_in_days && ` • ${formatAge(selectedPhoto.age_in_days)}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 添加/编辑照片模态框 */}
      {(showAddModal || editingPhoto) && (
        <AddPhotoModal
          photo={editingPhoto}
          selectedDogId={selectedDogId}
          onClose={() => {
            setShowAddModal(false)
            setEditingPhoto(null)
          }}
          onSuccess={() => {
            fetchPhotos()
            setShowAddModal(false)
            setEditingPhoto(null)
          }}
        />
      )}
    </div>
  )
}

// 添加照片模态框组件
function AddPhotoModal({ 
  photo, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  photo: GrowthPhoto | null
  selectedDogId: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    dog_id: photo?.dog_id || selectedDogId || '',
    photo_date: photo?.photo_date || new Date().toISOString().split('T')[0],
    photo_url: photo?.photo_url || '',
    caption: photo?.caption || '',
    age_in_days: photo?.age_in_days || ''
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!photo) {
      fetchDogs()
    }
  }, [photo])

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date')
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取狗狗列表失败:', error)
    }
  }

  const calculateAge = (dogId: string, photoDate: string) => {
    const dog = dogs.find(d => d.id === dogId)
    if (!dog || !dog.birth_date) return null
    
    const birthDate = new Date(dog.birth_date)
    const photoDateObj = new Date(photoDate)
    const diffTime = photoDateObj.getTime() - birthDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : null
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

      // 计算年龄
      const ageInDays = formData.age_in_days 
        ? parseInt(formData.age_in_days.toString())
        : calculateAge(formData.dog_id, formData.photo_date)

      const submitData = {
        user_id: user.id,
        dog_id: formData.dog_id,
        photo_date: formData.photo_date,
        photo_url: formData.photo_url,
        caption: formData.caption || null,
        age_in_days: ageInDays
      }

      if (photo) {
        // 更新现有照片
        const { error } = await supabase
          .from('growth_photos')
          .update(submitData)
          .eq('id', photo.id)

        if (error) throw error
      } else {
        // 创建新照片
        const { error } = await supabase
          .from('growth_photos')
          .insert([submitData])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存照片失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {photo ? '编辑照片' : '添加照片'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!photo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择狗狗 *
              </label>
              <select
                value={formData.dog_id}
                onChange={(e) => setFormData(prev => ({ ...prev, dog_id: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
              拍摄日期 *
            </label>
            <input
              type="date"
              value={formData.photo_date}
              onChange={(e) => setFormData(prev => ({ ...prev, photo_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              照片链接 *
            </label>
            <input
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              照片描述（可选）
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData(prev => ({ ...prev, caption: e.target.value }))}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="记录这张照片的故事..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              当时年龄（天数，可选）
            </label>
            <input
              type="number"
              min="0"
              value={formData.age_in_days}
              onChange={(e) => setFormData(prev => ({ ...prev, age_in_days: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="如果不填写，系统会自动计算"
            />
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
              disabled={loading}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (photo ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 