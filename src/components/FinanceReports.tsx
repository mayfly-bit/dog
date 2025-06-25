'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ReportData {
  totalPurchases: number
  totalSales: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  expensesByCategory: { [key: string]: number }
  monthlyData: MonthlyData[]
}

interface MonthlyData {
  month: string
  purchases: number
  sales: number
  expenses: number
  profit: number
}

export default function FinanceReports() {
  const [reportData, setReportData] = useState<ReportData>({
    totalPurchases: 0,
    totalSales: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    expensesByCategory: {},
    monthlyData: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // 计算日期范围
      let dateFilter = ''
      const now = new Date()
      
      switch (selectedPeriod) {
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter = `and created_at >= '${monthStart.toISOString()}'`
          break
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          dateFilter = `and created_at >= '${quarterStart.toISOString()}'`
          break
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1)
          dateFilter = `and created_at >= '${yearStart.toISOString()}'`
          break
        default:
          dateFilter = ''
      }

      // 获取进货数据
      const { data: purchases } = await supabase
        .from('purchases')
        .select('amount, purchase_date, created_at')
        .order('purchase_date', { ascending: false })

      // 获取销售数据
      const { data: sales } = await supabase
        .from('sales')
        .select('amount, sale_date, created_at')
        .order('sale_date', { ascending: false })

      // 获取支出数据
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category, expense_date, created_at')
        .order('expense_date', { ascending: false })

      // 计算总数
      const totalPurchases = purchases?.reduce((sum, item) => sum + item.amount, 0) || 0
      const totalSales = sales?.reduce((sum, item) => sum + item.amount, 0) || 0
      const totalExpenses = expenses?.reduce((sum, item) => sum + item.amount, 0) || 0
      const netProfit = totalSales - totalPurchases - totalExpenses
      const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0

      // 按类别统计支出
      const expensesByCategory: { [key: string]: number } = {}
      expenses?.forEach(expense => {
        expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + expense.amount
      })

      // 生成月度数据
      const monthlyData = generateMonthlyData(purchases || [], sales || [], expenses || [])

      setReportData({
        totalPurchases,
        totalSales,
        totalExpenses,
        netProfit,
        profitMargin,
        expensesByCategory,
        monthlyData
      })
    } catch (error) {
      console.error('获取报表数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyData = (purchases: any[], sales: any[], expenses: any[]): MonthlyData[] => {
    const monthlyMap: { [key: string]: MonthlyData } = {}
    
    // 初始化最近12个月的数据
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[monthKey] = {
        month: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' }),
        purchases: 0,
        sales: 0,
        expenses: 0,
        profit: 0
      }
    }

    // 统计进货
    purchases.forEach(purchase => {
      const date = new Date(purchase.purchase_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].purchases += purchase.amount
      }
    })

    // 统计销售
    sales.forEach(sale => {
      const date = new Date(sale.sale_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].sales += sale.amount
      }
    })

    // 统计支出
    expenses.forEach(expense => {
      const date = new Date(expense.expense_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].expenses += expense.amount
      }
    })

    // 计算利润
    Object.values(monthlyMap).forEach(data => {
      data.profit = data.sales - data.purchases - data.expenses
    })

    return Object.values(monthlyMap)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      medical: '医疗',
      food: '食物',
      grooming: '美容',
      breeding: '繁育',
      transport: '运输',
      other: '其他'
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">财务报表</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">全部时间</option>
          <option value="month">本月</option>
          <option value="quarter">本季度</option>
          <option value="year">本年</option>
        </select>
      </div>

      {/* 核心财务指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总收入</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.totalSales)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总成本</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(reportData.totalPurchases + reportData.totalExpenses)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">净利润</p>
              <p className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(reportData.netProfit)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              reportData.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className="text-2xl">
                {reportData.netProfit >= 0 ? '📈' : '📉'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">利润率</p>
              <p className={`text-2xl font-bold ${reportData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {reportData.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* 支出分类统计 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">支出分类统计</h3>
        {Object.keys(reportData.expensesByCategory).length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无支出数据</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(reportData.expensesByCategory)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">
                      {getCategoryLabel(category)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((amount / Math.max(...Object.values(reportData.expensesByCategory))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 月度趋势图 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">月度财务趋势</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">月份</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">进货</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">销售</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">支出</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">利润</th>
              </tr>
            </thead>
            <tbody>
              {reportData.monthlyData.map((data, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{data.month}</td>
                  <td className="py-3 px-4 text-sm text-right text-red-600">
                    {formatCurrency(data.purchases)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-green-600">
                    {formatCurrency(data.sales)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-orange-600">
                    {formatCurrency(data.expenses)}
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${
                    data.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 财务建议 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💡</span>
          财务洞察与建议
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          {reportData.profitMargin < 10 && (
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500 mt-0.5">⚠️</span>
              <p>利润率较低（{reportData.profitMargin.toFixed(1)}%），建议优化成本结构或提高销售价格</p>
            </div>
          )}
          
          {reportData.totalExpenses > reportData.totalSales * 0.3 && (
            <div className="flex items-start space-x-2">
              <span className="text-orange-500 mt-0.5">📊</span>
              <p>运营支出占销售收入比例较高，建议审查支出分类，优化运营效率</p>
            </div>
          )}
          
          {reportData.netProfit > 0 && (
            <div className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">✅</span>
              <p>恭喜！您的业务保持盈利状态，建议继续保持良好的财务管理</p>
            </div>
          )}
          
          <div className="flex items-start space-x-2">
            <span className="text-blue-500 mt-0.5">💼</span>
            <p>建议定期备份财务数据，并保持详细的记录以便未来分析和税务申报</p>
          </div>
        </div>
      </div>
    </div>
  )
} 