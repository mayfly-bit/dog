'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CheckupRecord {
  id: string
  dog_id: string
  type: 'checkup'
  date: string
  description: string
  document_url?: string
  created_at: string
  dogs?: {
    name: string
    breed: string
    gender: 'male' | 'female'
  }
}

interface CheckupRecordsProps {
  selectedDogId: string
}

export default function CheckupRecords({ selectedDogId }: CheckupRecordsProps) {
  const [records, setRecords] = useState<CheckupRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<CheckupRecord | null>(null)

  useEffect(() => {
    fetchRecords()
  }, [selectedDogId])

  const fetchRecords = async () => {
    try {
      let query = supabase
        .from('health_records')
        .select(`
          *,
          dogs:dog_id (
            name,
            breed,
            gender
          )
        `)
        .eq('type', 'checkup')
        .order('date', { ascending: false })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      const { data, error } = await query
      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('获取检查记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条检查记录吗？')) return

    try {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRecords()
    } catch (error) {
      console.error('删除检查记录失败:', error)
      alert('删除失败，请重试')
    }
  }

  const getCheckupType = (description: string) => {
    const types = {
      '体检': 'bg-green-100 text-green-800',
      '血检': 'bg-red-100 text-red-800',
      '尿检': 'bg-yellow-100 text-yellow-800',
      '粪检': 'bg-brown-100 text-brown-800',
      'X光': 'bg-blue-100 text-blue-800',
      'B超': 'bg-purple-100 text-purple-800',
      '心电图': 'bg-pink-100 text-pink-800',
      '眼科检查': 'bg-indigo-100 text-indigo-800',
      '牙科检查': 'bg-gray-100 text-gray-800',
      '皮肤检查': 'bg-orange-100 text-orange-800'
    }

    for (const [type, className] of Object.entries(types)) {
      if (description.includes(type)) {
        return { type, className }
      }
    }
    return { type: '常规检查', className: 'bg-green-100 text-green-800' }
  }

  const getHealthStatus = (description: string) => {
    if (description.includes('正常') || description.includes('健康') || description.includes('良好')) {
      return { status: '健康', className: 'text-green-600' }
    } else if (description.includes('异常') || description.includes('问题') || description.includes('疾病')) {
      return { status: '需关注', className: 'text-red-600' }
    } else if (description.includes('轻微') || description.includes('观察')) {
      return { status: '观察中', className: 'text-yellow-600' }
    }
    return { status: '已检查', className: 'text-blue-600' }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
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
          <h2 className="text-xl font-semibold text-gray-900">健康检查记录</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '当前狗狗的检查记录' : '所有狗狗的检查记录'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加检查记录</span>
        </button>
      </div>

      {/* 检查记录列表 */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无检查记录
          </h3>
          <p className="text-gray-500 mb-6">
            开始添加您的第一条健康检查记录吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            添加检查记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const checkupInfo = getCheckupType(record.description)
            const healthStatus = getHealthStatus(record.description)
            return (
              <div key={record.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {record.dogs?.name || '未知狗狗'}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {record.dogs?.breed || '未知品种'}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                        {record.dogs?.gender === 'male' ? '♂ 公' : '♀ 母'}
                      </span>
                      <span className={`px-2 py-1 text-sm rounded-full ${checkupInfo.className}`}>
                        {checkupInfo.type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">检查日期：</span>
                        <span className="font-medium">
                          {new Date(record.date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">检查类型：</span>
                        <span className="font-medium">
                          {checkupInfo.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">健康状态：</span>
                        <span className={`font-medium ${healthStatus.className}`}>
                          {healthStatus.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-500">检查结果：</span>
                      <span className="text-gray-700 ml-2">
                        {record.description}
                      </span>
                    </div>

                    {record.document_url && (
                      <div className="mt-3">
                        <a
                          href={record.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          📄 查看检查报告
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingRecord(record)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 添加/编辑检查记录模态框 */}
      {(showAddModal || editingRecord) && (
        <AddCheckupModal
          record={editingRecord}
          selectedDogId={selectedDogId}
          onClose={() => {
            setShowAddModal(false)
            setEditingRecord(null)
          }}
          onSuccess={() => {
            fetchRecords()
            setShowAddModal(false)
            setEditingRecord(null)
          }}
        />
      )}
    </div>
  )
}

// 添加检查记录模态框组件
function AddCheckupModal({ 
  record, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  record: CheckupRecord | null
  selectedDogId: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    dog_id: record?.dog_id || selectedDogId || '',
    date: record?.date || new Date().toISOString().split('T')[0],
    description: record?.description || '',
    document_url: record?.document_url || ''
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAvailableDogs()
  }, [])

  const fetchAvailableDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, gender')
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取狗狗列表失败:', error)
    }
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

      const submitData = {
        ...formData,
        type: 'checkup' as const,
        user_id: user.id
      }

      if (record) {
        // 更新现有记录
        const { error } = await supabase
          .from('health_records')
          .update(submitData)
          .eq('id', record.id)

        if (error) throw error
      } else {
        // 创建新记录
        const { error } = await supabase
          .from('health_records')
          .insert([submitData])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存检查记录失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const checkupTypes = [
    '常规体检',
    '血液检查',
    '尿液检查',
    '粪便检查',
    'X光检查',
    'B超检查',
    '心电图检查',
    '眼科检查',
    '牙科检查',
    '皮肤检查',
    '内分泌检查',
    '过敏测试'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {record ? '编辑检查记录' : '添加检查记录'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                  {dog.name} - {dog.breed} ({dog.gender === 'male' ? '公' : '母'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              检查日期 *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              检查详情 *
            </label>
            <div className="space-y-2">
              <select
                value=""
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">选择检查类型</option>
                {checkupTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="详细描述检查结果，包括医生诊断、建议等"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              检查报告链接（可选）
            </label>
            <input
              type="url"
              value={formData.document_url}
              onChange={(e) => setFormData(prev => ({ ...prev, document_url: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="输入检查报告的URL"
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (record ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 