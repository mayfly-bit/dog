'use client'

import { useState, useEffect, useMemo, memo } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { Dog, Heart, DollarSign, TrendingUp, Activity } from 'lucide-react'

interface StatCard {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color: string
}

// 骨架屏组件
const StatSkeleton = memo(() => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
))

StatSkeleton.displayName = 'StatSkeleton'

// 优化的统计卡片组件
const StatCardComponent = memo(({ stat }: { stat: StatCard }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
        {stat.trend && (
          <div className="flex items-center mt-2">
            <span
              className={`text-xs font-medium ${
                stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {stat.trend.isPositive ? '↗' : '↘'} {Math.abs(stat.trend.value)}%
            </span>
            <span className="text-xs text-gray-500 ml-1">vs 上月</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-white`}>
        {stat.icon}
      </div>
    </div>
  </div>
))

StatCardComponent.displayName = 'StatCardComponent'

export default function DashboardStats() {
  const { dogs } = useStore()
  const [stats, setStats] = useState<{
    healthRecords: number
    financeTotal: number
    breedingRecords: number
    loading: boolean
    error: string | null
  }>({
    healthRecords: 0,
    financeTotal: 0,
    breedingRecords: 0,
    loading: true,
    error: null
  })

  // 缓存统计数据获取
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))

        // 并行获取所有统计数据
        const [healthResult, expensesResult, littersResult] = await Promise.all([
          supabase
            .from('health_records')
            .select('id', { count: 'exact', head: true }),
          
          supabase
            .from('expenses')
            .select('amount'),
            
          supabase
            .from('litters')
            .select('id', { count: 'exact', head: true })
        ])

        // 计算财务总计
        const financeTotal = expensesResult.data?.reduce((sum, expense) => sum + expense.amount, 0) || 0

        setStats({
          healthRecords: healthResult.count || 0,
          financeTotal,
          breedingRecords: littersResult.count || 0,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('获取统计数据失败:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: '获取统计数据失败'
        }))
      }
    }

    fetchStats()
  }, [])

  // 计算统计卡片数据
  const statCards = useMemo((): StatCard[] => {
    const totalDogs = dogs.length
    const activeDogs = dogs.filter(dog => dog.status !== 'deceased' && dog.status !== 'sold').length

    return [
      {
        title: '总狗狗数',
        value: totalDogs,
        icon: <Dog className="h-6 w-6" />,
        trend: {
          value: 12,
          isPositive: true
        },
        color: 'bg-blue-500'
      },
      {
        title: '活跃狗狗',
        value: activeDogs,
        icon: <Activity className="h-6 w-6" />,
        color: 'bg-green-500'
      },
      {
        title: '健康记录',
        value: stats.healthRecords,
        icon: <Heart className="h-6 w-6" />,
        trend: {
          value: 8,
          isPositive: true
        },
        color: 'bg-red-500'
      },
      {
        title: '财务统计',
        value: `¥${stats.financeTotal.toLocaleString()}`,
        icon: <DollarSign className="h-6 w-6" />,
        trend: {
          value: 5,
          isPositive: false
        },
        color: 'bg-yellow-500'
      },
      {
        title: '繁殖记录',
        value: stats.breedingRecords,
        icon: <TrendingUp className="h-6 w-6" />,
        color: 'bg-purple-500'
      }
    ]
  }, [dogs, stats])

  if (stats.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">统计数据获取失败</h3>
            <p className="text-red-600 text-sm mt-1">{stats.error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.loading ? (
          // 骨架屏
          Array.from({ length: 5 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))
        ) : (
          statCards.map((stat, index) => (
            <StatCardComponent key={index} stat={stat} />
          ))
        )}
      </div>

      {/* 快速概览 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统概览</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">
              系统运行正常，所有功能可用
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">
              数据实时同步，信息安全存储
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">
              支持多设备访问，随时随地管理
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 