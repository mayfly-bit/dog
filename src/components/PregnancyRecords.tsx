'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface PregnancyRecord {
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

interface PregnancyRecordsProps {
  selectedDogId: string
}

export default function PregnancyRecords({ selectedDogId }: PregnancyRecordsProps) {
  const [records, setRecords] = useState<PregnancyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [selectedDogId])

  const fetchRecords = async () => {
    try {
      // 先获取基本的litters数据
      let query = supabase
        .from('litters')
        .select('*')
        .is('birth_date', null) // 只显示还未分娩的记录
        .order('expected_birth_date', { ascending: true })

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
      console.error('获取怀孕记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDaysToExpected = (expectedDate: string) => {
    const today = new Date()
    const expected = new Date(expectedDate)
    const diffTime = expected.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculatePregnancyDays = (matingDate: string) => {
    const today = new Date()
    const mating = new Date(matingDate)
    const diffTime = today.getTime() - mating.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusInfo = (record: PregnancyRecord) => {
    const daysToExpected = calculateDaysToExpected(record.expected_birth_date)
    const pregnancyDays = calculatePregnancyDays(record.mating_date)
    
    if (daysToExpected < 0) {
      return { status: '逾期', className: 'bg-red-100 text-red-800', description: '已超过预产期' }
    } else if (daysToExpected <= 3) {
      return { status: '临产', className: 'bg-red-100 text-red-800', description: '即将分娩，需密切关注' }
    } else if (daysToExpected <= 7) {
      return { status: '即将分娩', className: 'bg-orange-100 text-orange-800', description: '预产期在一周内' }
    } else if (pregnancyDays >= 45) {
      return { status: '妊娠后期', className: 'bg-yellow-100 text-yellow-800', description: '需要特别护理' }
    } else if (pregnancyDays >= 21) {
      return { status: '妊娠中期', className: 'bg-blue-100 text-blue-800', description: '胚胎发育期' }
    } else {
      return { status: '妊娠早期', className: 'bg-green-100 text-green-800', description: '需要营养补充' }
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
      {/* 顶部信息 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">怀孕记录</h2>
        <p className="text-sm text-gray-500 mt-1">
          追踪当前怀孕狗狗的妊娠进度和护理情况
        </p>
      </div>

      {/* 怀孕记录列表 */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🤱</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无怀孕记录
          </h3>
          <p className="text-gray-500">
            当前没有怀孕中的狗狗，或者您可以在配种记录中添加新的配种信息
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const statusInfo = getStatusInfo(record)
            const daysToExpected = calculateDaysToExpected(record.expected_birth_date)
            const pregnancyDays = calculatePregnancyDays(record.mating_date)
            
            return (
              <div key={record.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {record.mother?.name || '未知母犬'}
                      </h3>
                      <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.className}`}>
                        {statusInfo.status}
                      </span>
                      {daysToExpected <= 7 && daysToExpected >= 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full animate-pulse">
                          🚨 即将分娩
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
                        <span className="text-gray-500">预产期：</span>
                        <span className="font-medium">
                          {new Date(record.expected_birth_date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">妊娠天数：</span>
                        <span className="font-medium text-blue-600">
                          {pregnancyDays} 天
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">距离预产期：</span>
                        <span className={`font-medium ${daysToExpected <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                          {daysToExpected > 0 ? `${daysToExpected} 天` : '已逾期'}
                        </span>
                      </div>
                    </div>

                    {/* 妊娠进度条 */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>妊娠进度</span>
                        <span>{Math.min(Math.round((pregnancyDays / 63) * 100), 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((pregnancyDays / 63) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {statusInfo.description}
                      </div>
                    </div>

                    {/* 护理建议 */}
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                      <h4 className="text-sm font-medium text-pink-800 mb-2">护理建议</h4>
                      <div className="text-xs text-pink-700">
                        {pregnancyDays < 21 && (
                          <ul className="list-disc list-inside space-y-1">
                            <li>增加营养摄入，提供高质量蛋白质</li>
                            <li>避免剧烈运动，保持适度活动</li>
                            <li>定期检查，确认怀孕状态</li>
                          </ul>
                        )}
                        {pregnancyDays >= 21 && pregnancyDays < 45 && (
                          <ul className="list-disc list-inside space-y-1">
                            <li>增加食物份量，少食多餐</li>
                            <li>补充钙质和维生素</li>
                            <li>准备分娩环境，保持清洁</li>
                          </ul>
                        )}
                        {pregnancyDays >= 45 && (
                          <ul className="list-disc list-inside space-y-1">
                            <li>准备分娩用品，24小时监护</li>
                            <li>联系兽医，做好应急准备</li>
                            <li>减少外界干扰，保持安静环境</li>
                            {daysToExpected <= 3 && <li className="text-red-600 font-medium">⚠️ 随时可能分娩，密切观察</li>}
                          </ul>
                        )}
                      </div>
                    </div>

                    {record.notes && (
                      <div className="text-sm mt-3">
                        <span className="text-gray-500">备注：</span>
                        <span className="text-gray-700 ml-2">
                          {record.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 护理提醒卡片 */}
      {records.some(r => calculateDaysToExpected(r.expected_birth_date) <= 7) && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">🚨</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                紧急提醒
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>有狗狗即将在一周内分娩，请做好以下准备：</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>准备分娩箱和清洁毛巾</li>
                  <li>联系兽医，确保紧急情况下能及时就医</li>
                  <li>24小时监护，观察分娩征象</li>
                  <li>准备营养丰富的产后食物</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 