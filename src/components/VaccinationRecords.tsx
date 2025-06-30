'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface VaccinationRecord {
  id: string
  dog_id: string
  type: 'vaccination'
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

interface VaccinationRecordsProps {
  selectedDogId: string
}

export default function VaccinationRecords({ selectedDogId }: VaccinationRecordsProps) {
  const [records, setRecords] = useState<VaccinationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null)

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
        .eq('type', 'vaccination')
        .order('date', { ascending: false })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      const { data, error } = await query
      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('获取疫苗记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条疫苗记录吗？')) return

    try {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRecords()
    } catch (error) {
      console.error('删除疫苗记录失败:', error)
      alert('删除失败，请重试')
    }
  }

  const getVaccineType = (description: string) => {
    const types = {
      '狂犬': 'bg-red-100 text-red-800',
      '犬瘟': 'bg-yellow-100 text-yellow-800',
      '细小': 'bg-blue-100 text-blue-800',
      '传染性肝炎': 'bg-purple-100 text-purple-800',
      '副流感': 'bg-green-100 text-green-800',
      '腺病毒': 'bg-pink-100 text-pink-800',
      '钩端螺旋体': 'bg-orange-100 text-orange-800',
      '八联': 'bg-indigo-100 text-indigo-800',
      '六联': 'bg-gray-100 text-gray-800',
      '四联': 'bg-teal-100 text-teal-800'
    }

    for (const [type, className] of Object.entries(types)) {
      if (description.includes(type)) {
        return { type, className }
      }
    }
    return { type: '其他', className: 'bg-gray-100 text-gray-800' }
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
          <h2 className="text-xl font-semibold text-gray-900">疫苗接种记录</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '当前狗狗的疫苗记录' : '所有狗狗的疫苗记录'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加疫苗记录</span>
        </button>
      </div>

      {/* 疫苗记录列表 */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">💉</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无疫苗记录
          </h3>
          <p className="text-gray-500 mb-6">
            开始添加您的第一条疫苗接种记录吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            添加疫苗记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const vaccineInfo = getVaccineType(record.description)
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
                      <span className={`px-2 py-1 text-sm rounded-full ${vaccineInfo.className}`}>
                        {vaccineInfo.type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">接种日期：</span>
                        <span className="font-medium">
                          {new Date(record.date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">疫苗类型：</span>
                        <span className="font-medium">
                          {record.description.split('：')[0] || record.description}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">接种状态：</span>
                        <span className="font-medium text-green-600">
                          已完成
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-500">详细描述：</span>
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
                          📄 查看疫苗证明
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

      {/* 添加/编辑疫苗记录模态框 */}
      {(showAddModal || editingRecord) && (
        <AddVaccinationModal
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

// 添加疫苗记录模态框组件
function AddVaccinationModal({ 
  record, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  record: VaccinationRecord | null
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
        .select('id, name, breed, gender, status')
        .in('status', ['owned', 'for_sale'])  // 只显示"拥有中"和"在售"的狗狗，排除已售出的
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取可用狗狗列表失败:', error)
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
        type: 'vaccination' as const,
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
      console.error('保存疫苗记录失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const commonVaccines = [
    '狂犬疫苗',
    '犬瘟热疫苗', 
    '细小病毒疫苗',
    '传染性肝炎疫苗',
    '副流感疫苗',
    '腺病毒疫苗',
    '钩端螺旋体疫苗',
    '八联疫苗',
    '六联疫苗',
    '四联疫苗'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {record ? '编辑疫苗记录' : '添加疫苗记录'}
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              接种日期 *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              疫苗详情 *
            </label>
            <div className="space-y-2">
              <select
                value=""
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">选择常用疫苗</option>
                {commonVaccines.map((vaccine) => (
                  <option key={vaccine} value={vaccine}>
                    {vaccine}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="疫苗名称和详细信息"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              疫苗证明文档链接（可选）
            </label>
            <input
              type="url"
              value={formData.document_url}
              onChange={(e) => setFormData(prev => ({ ...prev, document_url: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="输入证明文档的URL"
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (record ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 