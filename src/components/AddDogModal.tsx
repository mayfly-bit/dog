'use client'

import { useState } from 'react'
import { supabase, handleSupabaseError } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Dog } from '@/types'

interface AddDogModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddDogModal({ isOpen, onClose }: AddDogModalProps) {
  const { user, addDog } = useStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    gender: 'male' as 'male' | 'female',
    birth_date: '',
    status: 'owned' as Dog['status'],
    sire_id: '',
    dam_id: '',
    photo_urls: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('请先登录')
      return
    }

    // 基本验证
    if (!formData.name.trim()) {
      toast.error('请输入狗狗名称')
      return
    }

    if (!formData.breed.trim()) {
      toast.error('请输入品种')
      return
    }

    if (!formData.birth_date) {
      toast.error('请选择出生日期')
      return
    }

    // 检查出生日期是否合理
    const birthDate = new Date(formData.birth_date)
    const today = new Date()
    if (birthDate > today) {
      toast.error('出生日期不能是未来日期')
      return
    }

    setLoading(true)
    const loadingToast = toast.loading('正在保存狗狗信息...')

    try {
      const newDog = {
        ...formData,
        user_id: user.id,
        sire_id: formData.sire_id || null,
        dam_id: formData.dam_id || null,
        photo_urls: formData.photo_urls || []
      }

      const { data, error } = await supabase
        .from('dogs')
        .insert([newDog])
        .select()
        .single()

      if (error) {
        throw error
      }

      addDog(data)
      toast.success('狗狗信息添加成功！', { id: loadingToast })
      onClose()
      
      // 重置表单
      setFormData({
        name: '',
        breed: '',
        gender: 'male',
        birth_date: '',
        status: 'owned',
        sire_id: '',
        dam_id: '',
        photo_urls: []
      })
    } catch (error: any) {
      console.error('添加狗狗失败:', error)
      const errorMessage = handleSupabaseError(error)
      toast.error(errorMessage, { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const uploadedUrls: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert(`不支持的文件格式: ${file.name}`)
        continue
      }

      // 验证文件大小 (最大5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`文件过大: ${file.name} (最大5MB)`)
        continue
      }

      try {
        // 生成文件名
        const fileName = `${Date.now()}_${file.name}`
        
        console.log('正在上传文件:', fileName)
        
        const { data, error } = await supabase.storage
          .from('dog-photos')
          .upload(fileName, file)

        if (error) {
          console.error('上传错误:', error)
          throw error
        }

        const { data: { publicUrl } } = supabase.storage
          .from('dog-photos')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
        console.log('上传成功:', publicUrl)
      } catch (error) {
        console.error('上传失败:', error)
        alert(`上传失败: ${file.name} - ${error}`)
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, ...uploadedUrls]
      }))
      alert(`成功上传 ${uploadedUrls.length} 张照片`)
    }
  }

  const addPhotoUrl = () => {
    const url = prompt('请输入图片URL（支持JPG、PNG、WebP、GIF）:')
    if (url && url.trim()) {
      // 简单验证URL格式
      const urlPattern = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i
      if (urlPattern.test(url.trim())) {
        setFormData(prev => ({
          ...prev,
          photo_urls: [...prev.photo_urls, url.trim()]
        }))
      } else {
        alert('请输入有效的图片URL，支持格式：JPG、PNG、WebP、GIF')
      }
    }
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_, i) => i !== index)
    }))
  }

  // 格式化日期输入的最大值（今天）
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">添加狗狗信息</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">姓名 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value.trim())}
                className="input"
                placeholder="输入狗狗名称"
                required
                disabled={loading}
                maxLength={50}
              />
            </div>

            <div>
              <label className="label">品种 *</label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => handleInputChange('breed', e.target.value.trim())}
                className="input"
                placeholder="输入品种"
                required
                disabled={loading}
                maxLength={50}
              />
            </div>

            <div>
              <label className="label">性别 *</label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="input"
                required
                disabled={loading}
              >
                <option value="male">公</option>
                <option value="female">母</option>
              </select>
            </div>

            <div>
              <label className="label">出生日期 *</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                className="input"
                required
                disabled={loading}
                max={getTodayDate()}
              />
            </div>

            <div>
              <label className="label">状态</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="input"
                disabled={loading}
              >
                <option value="owned">拥有中</option>
                <option value="for_sale">在售</option>
                <option value="sold">已售出</option>
                <option value="deceased">已过世</option>
                <option value="returned">已退回</option>
              </select>
            </div>
          </div>

          {/* 谱系信息 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">谱系信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">父亲ID</label>
                <input
                  type="text"
                  value={formData.sire_id}
                  onChange={(e) => handleInputChange('sire_id', e.target.value.trim())}
                  className="input"
                  placeholder="输入父亲狗狗ID（可选）"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">留空表示无父亲记录</p>
              </div>

              <div>
                <label className="label">母亲ID</label>
                <input
                  type="text"
                  value={formData.dam_id}
                  onChange={(e) => handleInputChange('dam_id', e.target.value.trim())}
                  className="input"
                  placeholder="输入母亲狗狗ID（可选）"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">留空表示无母亲记录</p>
              </div>
            </div>
          </div>

          {/* 照片上传 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">照片管理</h3>
            
            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加图片 - 方式1：使用图片URL（推荐）
                </label>
                <button
                  type="button"
                  onClick={addPhotoUrl}
                  className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  disabled={loading}
                >
                  + 点击添加图片URL
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  粘贴网络图片链接，支持JPG、PNG、WebP、GIF格式
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加图片 - 方式2：文件上传（需要配置存储桶）
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                     onClick={() => document.getElementById('photo-upload')?.click()}>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    点击上传照片文件
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    支持JPG、PNG、WebP、GIF格式，最大5MB
                  </p>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  disabled={loading}
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* 已上传的照片预览 */}
            {formData.photo_urls.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  已上传照片 ({formData.photo_urls.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photo_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`照片 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 