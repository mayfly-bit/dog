'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface FinanceStatsData {
  totalPurchases: number
  totalSales: number
  totalExpenses: number
  netProfit: number
  dogsInStock: number
  avgDogPrice: number
}

export default function FinanceStats() {
  const [stats, setStats] = useState<FinanceStatsData>({
    totalPurchases: 0,
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    dogsInStock: 0,
    avgDogPrice: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanceStats()
  }, [])

  const fetchFinanceStats = async () => {
    try {
      // 获取进货总额
      const { data: purchases } = await supabase
        .from('purchases')
        .select('amount')
      const totalPurchases = purchases?.reduce((sum, item) => sum + item.amount, 0) || 0

      // 获取销售总额
      const { data: sales } = await supabase
        .from('sales')
        .select('amount')
      const totalSales = sales?.reduce((sum, item) => sum + item.amount, 0) || 0

      // 获取支出总额
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
      const totalExpenses = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0

      // 获取在售狗狗数量和平均价格
      const { data: dogs } = await supabase
        .from('dogs')
        .select('purchase_price, sale_price, status')
        .eq('status', 'available')
      
      const dogsInStock = dogs?.length || 0
      const avgDogPrice = dogs?.length 
        ? dogs.reduce((sum, dog) => sum + (dog.sale_price || dog.purchase_price || 0), 0) / dogs.length
        : 0

      const netProfit = totalSales - totalPurchases - totalExpenses

      setStats({
        totalPurchases,
        totalSales,
        totalExpenses,
        netProfit,
        dogsInStock,
        avgDogPrice
      })
    } catch (error) {
      console.error('获取财务统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  const stats_cards = [
    {
      title: '进货总额',
      value: formatCurrency(stats.totalPurchases),
      icon: '📦',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: '销售总额',
      value: formatCurrency(stats.totalSales),
      icon: '💰',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: '支出总额',
      value: formatCurrency(stats.totalExpenses),
      icon: '💸',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      title: '净利润',
      value: formatCurrency(stats.netProfit),
      icon: '📈',
      bgColor: stats.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
      iconColor: stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: '在售狗狗',
      value: `${stats.dogsInStock} 只`,
      icon: '🐕',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: '平均价格',
      value: formatCurrency(stats.avgDogPrice),
      icon: '💎',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats_cards.map((card, index) => (
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
  )
} 