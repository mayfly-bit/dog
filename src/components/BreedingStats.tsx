'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BreedingStatsData {
  totalLitters: number
  activeMating: number
  pregnantDogs: number
  totalPuppies: number
  upcomingBirths: string[]
}

interface BreedingStatsProps {
  selectedDogId: string
  onDogSelect: (dogId: string) => void
}

export default function BreedingStats({ selectedDogId, onDogSelect }: BreedingStatsProps) {
  const [stats, setStats] = useState<BreedingStatsData>({
    totalLitters: 0,
    activeMating: 0,
    pregnantDogs: 0,
    totalPuppies: 0,
    upcomingBirths: []
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBreedingStats()
    fetchDogs()
  }, [selectedDogId])

  const fetchDogs = async () => {
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

  const fetchBreedingStats = async () => {
    try {
      // 获取繁殖记录总数
      let litterQuery = supabase
        .from('litters')
        .select('*', { count: 'exact', head: true })
      
      if (selectedDogId) {
        litterQuery = litterQuery.or(`mother_id.eq.${selectedDogId},father_id.eq.${selectedDogId}`)
      }
      
      const { count: totalLitters } = await litterQuery

      // 获取怀孕狗狗数量
      let pregnantQuery = supabase
        .from('dogs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pregnant')
      
      if (selectedDogId) {
        pregnantQuery = pregnantQuery.eq('id', selectedDogId)
      }
      
      const { count: pregnantDogs } = await pregnantQuery

      // 获取活跃配种记录（最近30天）
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      let matingQuery = supabase
        .from('litters')
        .select('*')
        .gte('mating_date', thirtyDaysAgo)
        .is('birth_date', null)
      
      if (selectedDogId) {
        matingQuery = matingQuery.or(`mother_id.eq.${selectedDogId},father_id.eq.${selectedDogId}`)
      }
      
      const { data: activeMatingData } = await matingQuery

      // 获取幼犬总数
      let puppyQuery = supabase
        .from('litters')
        .select('puppy_count')
      
      if (selectedDogId) {
        puppyQuery = puppyQuery.or(`mother_id.eq.${selectedDogId},father_id.eq.${selectedDogId}`)
      }
      
      const { data: litterData } = await puppyQuery
      const totalPuppies = litterData?.reduce((sum, litter) => sum + (litter.puppy_count || 0), 0) || 0

      // 获取即将分娩的狗狗（预产期在未来30天内）
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]
      
      let upcomingQuery = supabase
        .from('litters')
        .select('*')
        .gte('expected_birth_date', today)
        .lte('expected_birth_date', in30Days)
        .is('birth_date', null)
      
      if (selectedDogId) {
        upcomingQuery = upcomingQuery.or(`mother_id.eq.${selectedDogId},father_id.eq.${selectedDogId}`)
      }
      
      const { data: upcomingBirthsData } = await upcomingQuery
      
      // 获取相关狗狗信息
      let upcomingBirths: string[] = []
      if (upcomingBirthsData && upcomingBirthsData.length > 0) {
        const motherIds = upcomingBirthsData.map(l => l.mother_id).filter(Boolean)
        if (motherIds.length > 0) {
          const { data: mothersData } = await supabase
            .from('dogs')
            .select('id, name')
            .in('id', motherIds)
          
          const mothersMap = new Map(mothersData?.map(dog => [dog.id, dog.name]) || [])
          upcomingBirths = upcomingBirthsData.map(litter => 
            `${mothersMap.get(litter.mother_id) || '未知'} (${new Date(litter.expected_birth_date).toLocaleDateString('zh-CN')})`
          )
        }
      }

      setStats({
        totalLitters: totalLitters || 0,
        activeMating: activeMatingData?.length || 0,
        pregnantDogs: pregnantDogs || 0,
        totalPuppies,
        upcomingBirths
      })
    } catch (error) {
      console.error('获取繁殖统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: '总繁殖次数',
      value: stats.totalLitters,
      icon: '🐕‍🦺',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600'
    },
    {
      title: '活跃配种',
      value: stats.activeMating,
      icon: '💕',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      title: '怀孕狗狗',
      value: stats.pregnantDogs,
      icon: '🤱',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: '幼犬总数',
      value: stats.totalPuppies,
      icon: '🐶',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
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
          className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        >
          <option value="">所有狗狗</option>
          {dogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.name} - {dog.breed} ({dog.gender === 'male' ? '♂' : '♀'})
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

      {/* 即将分娩提醒 */}
      {stats.upcomingBirths.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-pink-400 text-xl">🚨</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-pink-800">
                即将分娩提醒
              </h3>
              <div className="mt-2 text-sm text-pink-700">
                <p>以下狗狗预计在30天内分娩：</p>
                <div className="mt-1 space-x-2">
                  {stats.upcomingBirths.map((birth, index) => (
                    <span key={index} className="inline-block bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs">
                      {birth}
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