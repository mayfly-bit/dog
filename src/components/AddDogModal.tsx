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
            <h3 className="text-lg font-medium text-gray-900 mb-4">照片</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                点击上传照片或拖拽到此处
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持 PNG, JPG, JPEG 格式（功能开发中）
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={loading}
                onChange={(e) => {
                  // TODO: 实现文件上传逻辑
                  console.log('文件上传功能待实现', e.target.files)
                  toast('照片上传功能正在开发中...', { icon: 'ℹ️' })
                }}
              />
            </div>
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