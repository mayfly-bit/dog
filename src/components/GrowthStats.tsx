'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface GrowthStatsData {
  totalRecords: number
  totalMilestones: number
  totalPhotos: number
  totalLogs: number
  latestWeight?: number
  weightChange?: number
}

interface GrowthStatsProps {
  selectedDogId: string
  onDogSelect: (dogId: string) => void
}

export default function GrowthStats({ selectedDogId, onDogSelect }: GrowthStatsProps) {
  const [stats, setStats] = useState<GrowthStatsData>({
    totalRecords: 0,
    totalMilestones: 0,
    totalPhotos: 0,
    totalLogs: 0
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGrowthStats()
    fetchDogs()
  }, [selectedDogId])

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date')
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取狗狗列表失败:', error)
    }
  }

  const fetchGrowthStats = async () => {
    try {
      // 获取成长记录数量
      let recordsQuery = supabase
        .from('growth_records')
        .select('*', { count: 'exact', head: true })
      
      if (selectedDogId) {
        recordsQuery = recordsQuery.eq('dog_id', selectedDogId)
      }
      
      const { count: totalRecords } = await recordsQuery

      // 获取里程碑数量
      let milestonesQuery = supabase
        .from('growth_milestones')
        .select('*', { count: 'exact', head: true })
      
      if (selectedDogId) {
        milestonesQuery = milestonesQuery.eq('dog_id', selectedDogId)
      }
      
      const { count: totalMilestones } = await milestonesQuery

      // 获取照片数量
      let photosQuery = supabase
        .from('growth_photos')
        .select('*', { count: 'exact', head: true })
      
      if (selectedDogId) {
        photosQuery = photosQuery.eq('dog_id', selectedDogId)
      }
      
      const { count: totalPhotos } = await photosQuery

      // 获取日志数量
      let logsQuery = supabase
        .from('growth_logs')
        .select('*', { count: 'exact', head: true })
      
      if (selectedDogId) {
        logsQuery = logsQuery.eq('dog_id', selectedDogId)
      }
      
      const { count: totalLogs } = await logsQuery

      // 获取最新体重和体重变化
      let latestWeight: number | undefined
      let weightChange: number | undefined

      if (selectedDogId) {
        const { data: weightData } = await supabase
          .from('growth_records')
          .select('weight, record_date')
          .eq('dog_id', selectedDogId)
          .not('weight', 'is', null)
          .order('record_date', { ascending: false })
          .limit(2)

        if (weightData && weightData.length > 0) {
          latestWeight = weightData[0].weight
          if (weightData.length > 1) {
            weightChange = weightData[0].weight - weightData[1].weight
          }
        }
      }

      setStats({
        totalRecords: totalRecords || 0,
        totalMilestones: totalMilestones || 0,
        totalPhotos: totalPhotos || 0,
        totalLogs: totalLogs || 0,
        latestWeight,
        weightChange
      })
    } catch (error) {
      console.error('获取成长统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const today = new Date()
    const diffTime = today.getTime() - birth.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} 天`
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} 个月`
    } else {
      const years = Math.floor(diffDays / 365)
      const months = Math.floor((diffDays % 365) / 30)
      return `${years} 岁 ${months} 个月`
    }
  }

  const statsCards = [
    {
      title: '成长记录',
      value: stats.totalRecords,
      icon: '📏',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: '重要里程碑',
      value: stats.totalMilestones,
      icon: '🎯',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: '成长照片',
      value: stats.totalPhotos,
      icon: '📷',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: '成长日志',
      value: stats.totalLogs,
      icon: '📝',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
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

  const selectedDog = selectedDogId ? dogs.find(d => d.id === selectedDogId) : null

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
        
        {/* 选中狗狗的基本信息 */}
        {selectedDog && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-4 text-sm">
              <div>
                <span className="text-gray-600">当前年龄：</span>
                <span className="font-medium text-blue-800">
                  {calculateAge(selectedDog.birth_date)}
                </span>
              </div>
              {stats.latestWeight && (
                <div>
                  <span className="text-gray-600">最新体重：</span>
                  <span className="font-medium text-blue-800">
                    {stats.latestWeight} kg
                  </span>
                  {stats.weightChange && (
                    <span className={`ml-1 ${stats.weightChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({stats.weightChange >= 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
    </div>
  )
} 