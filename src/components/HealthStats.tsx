'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface HealthStatsData {
  totalRecords: number
  upcomingVaccinations: number
  recentCheckups: number
  treatmentHistory: number
  dogsNeedingAttention: string[]
}

interface HealthStatsProps {
  selectedDogId: string
  onDogSelect: (dogId: string) => void
}

export default function HealthStats({ selectedDogId, onDogSelect }: HealthStatsProps) {
  const [stats, setStats] = useState<HealthStatsData>({
    totalRecords: 0,
    upcomingVaccinations: 0,
    recentCheckups: 0,
    treatmentHistory: 0,
    dogsNeedingAttention: []
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealthStats()
    fetchDogs()
  }, [selectedDogId])

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

  const fetchHealthStats = async () => {
    try {
      // 获取健康记录总数
      let totalQuery = supabase
        .from('health_records')
        .select('*', { count: 'exact', head: true })
      
      if (selectedDogId) {
        totalQuery = totalQuery.eq('dog_id', selectedDogId)
      }
      
      const { count: totalRecords } = await totalQuery

      // 获取疫苗记录
      let vaccinationQuery = supabase
        .from('health_records')
        .select('*')
        .eq('type', 'vaccination')
        .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 一年内
      
      if (selectedDogId) {
        vaccinationQuery = vaccinationQuery.eq('dog_id', selectedDogId)
      }
      
      const { data: vaccinations } = await vaccinationQuery

      // 获取最近检查
      let checkupQuery = supabase
        .from('health_records')
        .select('*')
        .eq('type', 'checkup')
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // 90天内
      
      if (selectedDogId) {
        checkupQuery = checkupQuery.eq('dog_id', selectedDogId)
      }
      
      const { data: checkups } = await checkupQuery

      // 获取治疗记录
      let treatmentQuery = supabase
        .from('health_records')
        .select('*')
        .eq('type', 'treatment')
      
      if (selectedDogId) {
        treatmentQuery = treatmentQuery.eq('dog_id', selectedDogId)
      }
      
      const { data: treatments } = await treatmentQuery

      // 计算需要注意的狗狗（超过6个月未检查）
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      let recentQuery = supabase
        .from('health_records')
        .select('dog_id, dogs(name)')
        .gte('date', sixMonthsAgo)
      
      if (selectedDogId) {
        recentQuery = recentQuery.eq('dog_id', selectedDogId)
      }
      
      const { data: recentRecords } = await recentQuery

      const checkedDogIds = new Set(recentRecords?.map(r => r.dog_id) || [])
      const relevantDogs = selectedDogId ? dogs.filter(d => d.id === selectedDogId) : dogs
      const dogsNeedingAttention = relevantDogs
        .filter(dog => !checkedDogIds.has(dog.id))
        .map(dog => dog.name)

      setStats({
        totalRecords: totalRecords || 0,
        upcomingVaccinations: vaccinations?.length || 0,
        recentCheckups: checkups?.length || 0,
        treatmentHistory: treatments?.length || 0,
        dogsNeedingAttention
      })
    } catch (error) {
      console.error('获取健康统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: '健康记录总数',
      value: stats.totalRecords,
      icon: '📋',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: '年内疫苗记录',
      value: stats.upcomingVaccinations,
      icon: '💉',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: '近期检查',
      value: stats.recentCheckups,
      icon: '🏥',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: '治疗记录',
      value: stats.treatmentHistory,
      icon: '💊',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 狗狗选择器 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择狗狗 (留空查看所有)
        </label>
        <select
          value={selectedDogId}
          onChange={(e) => onDogSelect(e.target.value)}
          className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">所有狗狗</option>
          {dogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.name} - {dog.breed}
            </option>
          ))}
        </select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <span className={`text-2xl ${card.iconColor}`}>
                  {card.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 需要关注的狗狗提醒 */}
      {stats.dogsNeedingAttention.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                需要健康检查的狗狗
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>以下狗狗超过6个月未进行健康检查：</p>
                <div className="mt-1 space-x-2">
                  {stats.dogsNeedingAttention.map((dogName, index) => (
                    <span key={index} className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      {dogName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 