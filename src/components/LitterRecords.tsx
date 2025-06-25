'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface LitterRecord {
  id: string
  mother_id: string
  father_id: string
  mating_date: string
  expected_birth_date: string
  birth_date?: string
  puppy_count?: number
  notes?: string
  mother?: {
    name: string
    breed: string
  }
  father?: {
    name: string
    breed: string
  }
}

interface LitterRecordsProps {
  selectedDogId: string
}

export default function LitterRecords({ selectedDogId }: LitterRecordsProps) {
  const [records, setRecords] = useState<LitterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<LitterRecord | null>(null)

  useEffect(() => {
    fetchRecords()
  }, [selectedDogId])

  const fetchRecords = async () => {
    try {
      // 先获取基本的litters数据
      let query = supabase
        .from('litters')
        .select('*')
        .not('birth_date', 'is', null) // 只显示已分娩的记录
        .order('birth_date', { ascending: false })

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
      console.error('获取产仔记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBirthInfo = async (record: LitterRecord, birthDate: string, puppyCount: number, notes: string) => {
    try {
      const { error } = await supabase
        .from('litters')
        .update({
          birth_date: birthDate,
          puppy_count: puppyCount,
          notes: notes
        })
        .eq('id', record.id)

      if (error) throw error
      fetchRecords()
    } catch (error) {
      console.error('更新产仔信息失败:', error)
      alert('更新失败，请重试')
    }
  }

  const calculatePuppyAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const diffTime = today.getTime() - birth.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 7) {
      return `${diffDays} 天`
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} 周`
    } else {
      return `${Math.floor(diffDays / 30)} 个月`
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
          <h2 className="text-xl font-semibold text-gray-900">产仔记录</h2>
          <p className="text-sm text-gray-500 mt-1">
            已分娩的狗狗和幼犬信息记录
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>记录分娩</span>
        </button>
      </div>

      {/* 产仔记录列表 */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🐶</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无产仔记录
          </h3>
          <p className="text-gray-500 mb-6">
            还没有分娩记录，您可以为已分娩的狗狗添加产仔信息
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            记录分娩
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const puppyAge = record.birth_date ? calculatePuppyAge(record.birth_date) : ''
            
            return (
              <div key={record.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        第 {record.id.slice(-4)} 胎
                      </h3>
                      <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                        已分娩
                      </span>
                      {record.puppy_count && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                          {record.puppy_count} 只幼犬
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
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
                        <span className="text-gray-500">分娩日期：</span>
                        <span className="font-medium text-green-600">
                          {record.birth_date ? new Date(record.birth_date).toLocaleDateString('zh-CN') : '未记录'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">幼犬数量：</span>
                        <span className="font-medium text-yellow-600">
                          {record.puppy_count || 0} 只
                        </span>
                      </div>
                      {record.birth_date && (
                        <div>
                          <span className="text-gray-500">幼犬年龄：</span>
                          <span className="font-medium text-blue-600">
                            {puppyAge}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 幼犬健康状态卡片 */}
                    {record.birth_date && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">幼犬护理提醒</h4>
                        <div className="text-xs text-yellow-700">
                          {(() => {
                            const days = Math.floor((new Date().getTime() - new Date(record.birth_date!).getTime()) / (1000 * 60 * 60 * 24))
                            if (days < 7) {
                              return (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>保持温暖，维持体温稳定</li>
                                  <li>确保幼犬能正常吸奶</li>
                                  <li>观察母犬是否有足够奶水</li>
                                  <li>保持环境清洁和安静</li>
                                </ul>
                              )
                            } else if (days < 21) {
                              return (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>开始睁眼，注意眼部清洁</li>
                                  <li>母犬营养要充足</li>
                                  <li>准备断奶的准备工作</li>
                                </ul>
                              )
                            } else if (days < 60) {
                              return (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>开始断奶，逐步添加幼犬粮</li>
                                  <li>第一次疫苗接种准备</li>
                                  <li>社会化训练开始</li>
                                </ul>
                              )
                            } else {
                              return (
                                <ul className="list-disc list-inside space-y-1">
                                  <li>完成疫苗接种计划</li>
                                  <li>可以考虑寻找新家庭</li>
                                  <li>继续社会化和基础训练</li>
                                </ul>
                              )
                            }
                          })()}
                        </div>
                      </div>
                    )}

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
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 添加/编辑产仔记录模态框 */}
      {(showAddModal || editingRecord) && (
        <AddLitterModal
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

// 添加产仔记录模态框组件
function AddLitterModal({ 
  record, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  record: LitterRecord | null
  selectedDogId: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    birth_date: record?.birth_date || new Date().toISOString().split('T')[0],
    puppy_count: record?.puppy_count || 1,
    notes: record?.notes || ''
  })
  const [pregnantRecords, setPregnantRecords] = useState<any[]>([])
  const [selectedPregnancy, setSelectedPregnancy] = useState(record?.id || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!record) {
      fetchPregnantRecords()
    }
  }, [record])

  const fetchPregnantRecords = async () => {
    try {
      let query = supabase
        .from('litters')
        .select('*')
        .is('birth_date', null) // 只显示还未分娩的记录

      if (selectedDogId) {
        query = query.or(`mother_id.eq.${selectedDogId},father_id.eq.${selectedDogId}`)
      }

      const { data: littersData, error } = await query
      if (error) throw error

      if (!littersData || littersData.length === 0) {
        setPregnantRecords([])
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

      setPregnantRecords(recordsWithDogs)
    } catch (error) {
      console.error('获取怀孕记录失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const targetId = record?.id || selectedPregnancy
      if (!targetId) {
        alert('请选择要记录分娩的配种记录')
        return
      }

      const { error } = await supabase
        .from('litters')
        .update({
          birth_date: formData.birth_date,
          puppy_count: formData.puppy_count,
          notes: formData.notes
        })
        .eq('id', targetId)

      if (error) throw error

      // 如果有母犬信息，更新母犬状态为哺乳期
      if (!record && selectedPregnancy) {
        const pregnantRecord = pregnantRecords.find(r => r.id === selectedPregnancy)
        if (pregnantRecord?.mother_id) {
          await supabase
            .from('dogs')
            .update({ status: 'lactating' })
            .eq('id', pregnantRecord.mother_id)
        }
      }

      onSuccess()
    } catch (error) {
      console.error('保存产仔记录失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {record ? '编辑产仔记录' : '记录分娩信息'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!record && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择配种记录 *
              </label>
              <select
                value={selectedPregnancy}
                onChange={(e) => setSelectedPregnancy(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">请选择要记录分娩的配种记录</option>
                {pregnantRecords.map((pregnancy) => (
                  <option key={pregnancy.id} value={pregnancy.id}>
                    {pregnancy.mother?.name} × {pregnancy.father?.name} 
                    (预产期: {new Date(pregnancy.expected_birth_date).toLocaleDateString('zh-CN')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分娩日期 *
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              幼犬数量 *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={formData.puppy_count}
              onChange={(e) => setFormData(prev => ({ ...prev, puppy_count: parseInt(e.target.value) || 0 }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分娩备注（可选）
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="记录分娩过程、幼犬健康状况等信息"
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
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (record ? '更新' : '记录')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 