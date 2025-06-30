'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface MatingRecord {
  id: string
  mother_id: string
  father_id: string
  mating_date: string
  expected_birth_date: string
  birth_date?: string
  puppy_count?: number
  notes?: string
  created_at: string
  mother?: {
    name: string
    breed: string
  }
  father?: {
    name: string
    breed: string
  }
}

interface MatingRecordsProps {
  selectedDogId: string
}

export default function MatingRecords({ selectedDogId }: MatingRecordsProps) {
  const [records, setRecords] = useState<MatingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MatingRecord | null>(null)

  useEffect(() => {
    fetchRecords()
  }, [selectedDogId])

  const fetchRecords = async () => {
    try {
      // 先获取基本的litters数据
      let query = supabase
        .from('litters')
        .select('*')
        .order('mating_date', { ascending: false })

      if (selectedDogId) {
        query = query.or(`mother_id.eq.${selectedDogId},father_id.eq.${selectedDogId}`)
      }

      const { data: littersData, error: littersError } = await query
      if (littersError) throw littersError

      if (!littersData || littersData.length === 0) {
        setRecords([])
        return
      }

      // 获取所有相关的狗狗信息
      const allDogIds = [
        ...littersData.map(l => l.mother_id),
        ...littersData.map(l => l.father_id)
      ].filter(Boolean)
      const dogIds = Array.from(new Set(allDogIds))

      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, breed')
        .in('id', dogIds)

      if (dogsError) throw dogsError

      // 手动关联数据
      const dogsMap = new Map(dogsData?.map(dog => [dog.id, dog]) || [])
      
      const recordsWithDogs = littersData.map(litter => ({
        ...litter,
        mother: litter.mother_id ? dogsMap.get(litter.mother_id) : null,
        father: litter.father_id ? dogsMap.get(litter.father_id) : null
      }))

      setRecords(recordsWithDogs)
    } catch (error) {
      console.error('获取配种记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条配种记录吗？')) return

    try {
      const { error } = await supabase
        .from('litters')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRecords()
    } catch (error) {
      console.error('删除配种记录失败:', error)
      alert('删除失败，请重试')
    }
  }

  const calculateDaysToExpected = (expectedDate: string) => {
    const today = new Date()
    const expected = new Date(expectedDate)
    const diffTime = expected.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusInfo = (record: MatingRecord) => {
    if (record.birth_date) {
      return { status: '已分娩', className: 'bg-green-100 text-green-800' }
    }
    
    const daysToExpected = calculateDaysToExpected(record.expected_birth_date)
    
    if (daysToExpected < 0) {
      return { status: '逾期', className: 'bg-red-100 text-red-800' }
    } else if (daysToExpected <= 7) {
      return { status: '即将分娩', className: 'bg-orange-100 text-orange-800' }
    } else if (daysToExpected <= 30) {
      return { status: '妊娠后期', className: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { status: '妊娠中', className: 'bg-blue-100 text-blue-800' }
    }
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
          <h2 className="text-xl font-semibold text-gray-900">配种记录</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '当前狗狗的配种记录' : '所有狗狗的配种记录'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加配种记录</span>
        </button>
      </div>

      {/* 配种记录列表 */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">💕</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无配种记录
          </h3>
          <p className="text-gray-500 mb-6">
            开始添加您的第一条配种记录吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            添加配种记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const statusInfo = getStatusInfo(record)
            const daysToExpected = calculateDaysToExpected(record.expected_birth_date)
            
            return (
              <div key={record.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        配种记录
                      </h3>
                      <span className={`px-2 py-1 text-sm rounded-full ${statusInfo.className}`}>
                        {statusInfo.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">母犬：</span>
                        <span className="font-medium">
                          {record.mother?.name || '未知'} ({record.mother?.breed || '未知品种'})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">公犬：</span>
                        <span className="font-medium">
                          {record.father?.name || '未知'} ({record.father?.breed || '未知品种'})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">配种日期：</span>
                        <span className="font-medium">
                          {new Date(record.mating_date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">预产期：</span>
                        <span className="font-medium">
                          {new Date(record.expected_birth_date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">距离预产期：</span>
                        <span className={`font-medium ${daysToExpected <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                          {daysToExpected > 0 ? `${daysToExpected} 天` : '已逾期'}
                        </span>
                      </div>
                      {record.puppy_count && (
                        <div>
                          <span className="text-gray-500">幼犬数量：</span>
                          <span className="font-medium text-green-600">
                            {record.puppy_count} 只
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {record.notes && (
                      <div className="text-sm">
                        <span className="text-gray-500">备注：</span>
                        <span className="text-gray-700 ml-2">
                          {record.notes}
                        </span>
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

      {/* 添加/编辑配种记录模态框 */}
      {(showAddModal || editingRecord) && (
        <AddMatingModal
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

// 添加配种记录模态框组件
function AddMatingModal({ 
  record, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  record: MatingRecord | null
  selectedDogId: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    mother_id: record?.mother_id || (selectedDogId || ''),
    father_id: record?.father_id || '',
    mating_date: record?.mating_date || new Date().toISOString().split('T')[0],
    expected_birth_date: record?.expected_birth_date || '',
    notes: record?.notes || ''
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAvailableDogs()
    if (!record?.expected_birth_date && formData.mating_date) {
      // 自动计算预产期（配种后63天）
      const matingDate = new Date(formData.mating_date)
      const expectedDate = new Date(matingDate.getTime() + 63 * 24 * 60 * 60 * 1000)
      setFormData(prev => ({
        ...prev,
        expected_birth_date: expectedDate.toISOString().split('T')[0]
      }))
    }
  }, [record, formData.mating_date])

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
        user_id: user.id
      }

      if (record) {
        // 更新现有记录
        const { error } = await supabase
          .from('litters')
          .update(submitData)
          .eq('id', record.id)

        if (error) throw error
      } else {
        // 创建新记录
        const { error } = await supabase
          .from('litters')
          .insert([submitData])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存配种记录失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const maleDogs = dogs.filter(dog => dog.gender === 'male')
  const femaleDogs = dogs.filter(dog => dog.gender === 'female')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {record ? '编辑配种记录' : '添加配种记录'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              母犬 *
            </label>
            <select
              value={formData.mother_id}
              onChange={(e) => setFormData(prev => ({ ...prev, mother_id: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">请选择母犬</option>
              {femaleDogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name} - {dog.breed}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公犬 *
            </label>
            <select
              value={formData.father_id}
              onChange={(e) => setFormData(prev => ({ ...prev, father_id: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">请选择公犬</option>
              {maleDogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name} - {dog.breed}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              配种日期 *
            </label>
            <input
              type="date"
              value={formData.mating_date}
              onChange={(e) => setFormData(prev => ({ ...prev, mating_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              预产期 *
            </label>
            <input
              type="date"
              value={formData.expected_birth_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expected_birth_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              一般配种后63天左右分娩
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注（可选）
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="记录配种相关的备注信息"
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
              {loading ? '保存中...' : (record ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 