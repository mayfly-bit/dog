'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface GrowthRecord {
  id: string
  dog_id: string
  record_date: string
  weight?: number
  height?: number
  length?: number
  chest_girth?: number
  notes?: string
  created_at: string
}

interface GrowthRecordsProps {
  selectedDogId: string
}

export default function GrowthRecords({ selectedDogId }: GrowthRecordsProps) {
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null)

  useEffect(() => {
    fetchRecords()
  }, [selectedDogId])

  const fetchRecords = async () => {
    try {
      let query = supabase
        .from('growth_records')
        .select('*')
        .order('record_date', { ascending: false })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      const { data, error } = await query
      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('获取成长记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条成长记录吗？')) return

    try {
      const { error } = await supabase
        .from('growth_records')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRecords()
    } catch (error) {
      console.error('删除成长记录失败:', error)
      alert('删除失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
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
          <h2 className="text-xl font-semibold text-gray-900">成长记录</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '当前狗狗的成长数据' : '所有狗狗的成长数据'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加记录</span>
        </button>
      </div>

      {/* 成长记录列表 */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📏</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无成长记录
          </h3>
          <p className="text-gray-500 mb-6">
            开始记录狗狗的成长数据吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加成长记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {new Date(record.record_date).toLocaleDateString('zh-CN')}
                    </h3>
                    <span className="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                      成长记录
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    {record.weight && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-600 font-medium">体重</div>
                        <div className="text-lg font-bold text-blue-800">{record.weight} kg</div>
                      </div>
                    )}
                    {record.height && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-600 font-medium">身高</div>
                        <div className="text-lg font-bold text-green-800">{record.height} cm</div>
                      </div>
                    )}
                    {record.length && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-purple-600 font-medium">体长</div>
                        <div className="text-lg font-bold text-purple-800">{record.length} cm</div>
                      </div>
                    )}
                    {record.chest_girth && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-orange-600 font-medium">胸围</div>
                        <div className="text-lg font-bold text-orange-800">{record.chest_girth} cm</div>
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
          ))}
        </div>
      )}

      {/* 添加/编辑记录模态框 */}
      {(showAddModal || editingRecord) && (
        <AddGrowthRecordModal
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

// 添加成长记录模态框组件
function AddGrowthRecordModal({ 
  record, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  record: GrowthRecord | null
  selectedDogId: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    dog_id: record?.dog_id || selectedDogId || '',
    record_date: record?.record_date || new Date().toISOString().split('T')[0],
    weight: record?.weight || '',
    height: record?.height || '',
    length: record?.length || '',
    chest_girth: record?.chest_girth || '',
    notes: record?.notes || ''
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!record) {
      fetchDogs()
    }
  }, [record])

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
        user_id: user.id,
        dog_id: formData.dog_id,
        record_date: formData.record_date,
        weight: formData.weight ? parseFloat(formData.weight.toString()) : null,
        height: formData.height ? parseFloat(formData.height.toString()) : null,
        length: formData.length ? parseFloat(formData.length.toString()) : null,
        chest_girth: formData.chest_girth ? parseFloat(formData.chest_girth.toString()) : null,
        notes: formData.notes || null
      }

      if (record) {
        // 更新现有记录
        const { error } = await supabase
          .from('growth_records')
          .update(submitData)
          .eq('id', record.id)

        if (error) throw error
      } else {
        // 创建新记录
        const { error } = await supabase
          .from('growth_records')
          .insert([submitData])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存成长记录失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {record ? '编辑成长记录' : '添加成长记录'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!record && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择狗狗 *
              </label>
              <select
                value={formData.dog_id}
                onChange={(e) => setFormData(prev => ({ ...prev, dog_id: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              记录日期 *
            </label>
            <input
              type="date"
              value={formData.record_date}
              onChange={(e) => setFormData(prev => ({ ...prev, record_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                体重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: 25.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身高 (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: 60.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                体长 (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.length}
                onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: 80.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                胸围 (cm)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.chest_girth}
                onChange={(e) => setFormData(prev => ({ ...prev, chest_girth: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: 70.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注（可选）
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="记录当天的特殊情况或观察"
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (record ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 