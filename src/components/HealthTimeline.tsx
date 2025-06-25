'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface HealthRecord {
  id: string
  dog_id: string
  type: 'vaccination' | 'checkup' | 'treatment'
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

interface HealthTimelineProps {
  selectedDogId: string
}

export default function HealthTimeline({ selectedDogId }: HealthTimelineProps) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'vaccination' | 'checkup' | 'treatment'>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    fetchRecords()
  }, [selectedDogId, filter, sortOrder])

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
        .order('date', { ascending: sortOrder === 'asc' })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      if (filter !== 'all') {
        query = query.eq('type', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('获取健康记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'vaccination':
        return { 
          icon: '💉', 
          label: '疫苗接种', 
          bgColor: 'bg-green-100', 
          iconColor: 'text-green-600',
          borderColor: 'border-green-200'
        }
      case 'checkup':
        return { 
          icon: '🏥', 
          label: '健康检查', 
          bgColor: 'bg-purple-100', 
          iconColor: 'text-purple-600',
          borderColor: 'border-purple-200'
        }
      case 'treatment':
        return { 
          icon: '💊', 
          label: '医疗治疗', 
          bgColor: 'bg-red-100', 
          iconColor: 'text-red-600',
          borderColor: 'border-red-200'
        }
      default:
        return { 
          icon: '📋', 
          label: '其他', 
          bgColor: 'bg-gray-100', 
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200'
        }
    }
  }

  const groupRecordsByMonth = (records: HealthRecord[]) => {
    const grouped: { [key: string]: HealthRecord[] } = {}
    
    records.forEach(record => {
      const date = new Date(record.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(record)
    })
    
    return grouped
  }

  const formatMonthYear = (monthKey: string) => {
    const [year, month] = monthKey.split('-')
    return `${year}年${month}月`
  }

  const groupedRecords = groupRecordsByMonth(records)
  const monthKeys = Object.keys(groupedRecords).sort((a, b) => {
    return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b)
  })

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="space-y-4 ml-8">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 bg-white p-4 rounded-lg border">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* 顶部控制栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">健康时间轴</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '当前狗狗的健康历史' : '所有狗狗的健康历史'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          {/* 类型筛选 */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有记录</option>
            <option value="vaccination">疫苗接种</option>
            <option value="checkup">健康检查</option>
            <option value="treatment">医疗治疗</option>
          </select>
          
          {/* 排序控制 */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <span className="text-sm">
              {sortOrder === 'desc' ? '最新在前' : '最早在前'}
            </span>
            <span>
              {sortOrder === 'desc' ? '⬇️' : '⬆️'}
            </span>
          </button>
        </div>
      </div>

      {/* 时间轴内容 */}
      {records.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无健康记录
          </h3>
          <p className="text-gray-500">
            {filter !== 'all' 
              ? `暂无${getTypeInfo(filter).label}记录` 
              : '还没有任何健康记录，开始记录狗狗的健康状况吧'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {monthKeys.map((monthKey) => (
            <div key={monthKey} className="relative">
              {/* 月份标题 */}
              <div className="sticky top-0 bg-white z-10 pb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
                    {formatMonthYear(monthKey)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {groupedRecords[monthKey].length} 条记录
                  </span>
                </h3>
              </div>

              {/* 该月的记录 */}
              <div className="relative ml-8">
                {/* 时间轴线 */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  {groupedRecords[monthKey].map((record, index) => {
                    const typeInfo = getTypeInfo(record.type)
                    const isLast = index === groupedRecords[monthKey].length - 1
                    
                    return (
                      <div key={record.id} className="relative flex items-start space-x-4">
                        {/* 时间轴节点 */}
                        <div className={`relative z-10 flex items-center justify-center w-10 h-10 ${typeInfo.bgColor} rounded-full border-2 ${typeInfo.borderColor}`}>
                          <span className={`text-lg ${typeInfo.iconColor}`}>
                            {typeInfo.icon}
                          </span>
                        </div>
                        
                        {/* 记录卡片 */}
                        <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {record.dogs?.name || '未知狗狗'}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${typeInfo.bgColor} ${typeInfo.iconColor}`}>
                                  {typeInfo.label}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {record.dogs?.breed || '未知品种'}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">
                                {record.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {new Date(record.date).toLocaleDateString('zh-CN', {
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'short'
                                  })}
                                </span>
                                
                                {record.document_url && (
                                  <a
                                    href={record.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                  >
                                    <span>📎</span>
                                    <span>查看文档</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {records.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">统计概览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {records.filter(r => r.type === 'vaccination').length}
              </div>
              <div className="text-sm text-gray-600">疫苗接种</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {records.filter(r => r.type === 'checkup').length}
              </div>
              <div className="text-sm text-gray-600">健康检查</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {records.filter(r => r.type === 'treatment').length}
              </div>
              <div className="text-sm text-gray-600">医疗治疗</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {records.length}
              </div>
              <div className="text-sm text-gray-600">总记录数</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 