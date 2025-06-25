'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  AreaChart
} from 'recharts'

interface GrowthRecord {
  id: string
  dog_id: string
  record_date: string
  weight?: number
  height?: number
  length?: number
  chest_girth?: number
  created_at: string
}

interface Dog {
  id: string
  name: string
  breed: string
  birth_date: string
}

interface GrowthChartsProps {
  selectedDogId: string
}

interface ChartDataPoint {
  date: string
  weight?: number
  height?: number
  length?: number
  chest_girth?: number
  age_in_days?: number
  formatted_date?: string
}

const CHART_TYPES = [
  { value: 'weight', label: '体重趋势', icon: '⚖️', color: '#3B82F6' },
  { value: 'height', label: '身高趋势', icon: '📏', color: '#10B981' },
  { value: 'length', label: '体长趋势', icon: '📐', color: '#F59E0B' },
  { value: 'chest_girth', label: '胸围趋势', icon: '📊', color: '#EF4444' },
  { value: 'combined', label: '综合对比', icon: '📈', color: '#8B5CF6' },
  { value: 'growth_rate', label: '成长速度', icon: '🚀', color: '#06B6D4' }
]

const TIME_RANGES = [
  { value: '1month', label: '最近1个月' },
  { value: '3months', label: '最近3个月' },
  { value: '6months', label: '最近6个月' },
  { value: '1year', label: '最近1年' },
  { value: 'all', label: '全部时间' }
]

export default function GrowthCharts({ selectedDogId }: GrowthChartsProps) {
  const [records, setRecords] = useState<GrowthRecord[]>([])
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('weight')
  const [timeRange, setTimeRange] = useState('6months')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    fetchData()
  }, [selectedDogId, timeRange])

  useEffect(() => {
    processChartData()
  }, [records, chartType])

  const fetchData = async () => {
    try {
      // 获取狗狗信息
      const { data: dogsData, error: dogsError } = await supabase
        .from('dogs')
        .select('id, name, breed, birth_date')
        .order('name')

      if (dogsError) throw dogsError
      setDogs(dogsData || [])

      // 获取成长记录
      let query = supabase
        .from('growth_records')
        .select('*')
        .order('record_date', { ascending: true })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      // 应用时间范围过滤
      if (timeRange !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (timeRange) {
          case '1month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case '3months':
            startDate.setMonth(now.getMonth() - 3)
            break
          case '6months':
            startDate.setMonth(now.getMonth() - 6)
            break
          case '1year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        query = query.gte('record_date', startDate.toISOString().split('T')[0])
      }

      const { data: recordsData, error: recordsError } = await query
      if (recordsError) throw recordsError
      
      setRecords(recordsData || [])
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const processChartData = () => {
    if (!records.length) {
      setChartData([])
      return
    }

    const processedData: ChartDataPoint[] = records.map((record, index) => {
      const date = new Date(record.record_date)
      const dog = dogs.find(d => d.id === record.dog_id)
      
      // 计算年龄（天数）
      let ageInDays = 0
      if (dog?.birth_date) {
        const birthDate = new Date(dog.birth_date)
        ageInDays = Math.floor((date.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        date: record.record_date,
        formatted_date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        weight: record.weight || undefined,
        height: record.height || undefined,
        length: record.length || undefined,
        chest_girth: record.chest_girth || undefined,
        age_in_days: ageInDays
      }
    })

    // 如果是成长速度图表，计算增长率
    if (chartType === 'growth_rate') {
      const rateData = processedData.map((point, index) => {
        if (index === 0) return { ...point, weight_rate: 0, height_rate: 0 }
        
        const prev = processedData[index - 1]
        const weightRate = point.weight && prev.weight 
          ? ((point.weight - prev.weight) / prev.weight * 100)
          : 0
        const heightRate = point.height && prev.height 
          ? ((point.height - prev.height) / prev.height * 100)
          : 0

        return {
          ...point,
          weight_rate: Number(weightRate.toFixed(2)),
          height_rate: Number(heightRate.toFixed(2))
        }
      })
      setChartData(rateData)
    } else {
      setChartData(processedData)
    }
  }

  const getSelectedDogInfo = () => {
    if (!selectedDogId) return null
    return dogs.find(d => d.id === selectedDogId)
  }

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <div className="h-96 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>暂无数据</p>
          </div>
        </div>
      )
    }

    const selectedChart = CHART_TYPES.find(c => c.value === chartType)

    switch (chartType) {
      case 'weight':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formatted_date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: '体重 (kg)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(label) => `日期: ${label}`}
                formatter={(value: any) => [`${value} kg`, '体重']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke={selectedChart?.color} 
                strokeWidth={3}
                dot={{ fill: selectedChart?.color, strokeWidth: 2, r: 4 }}
                name="体重"
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'height':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formatted_date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: '身高 (cm)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(label) => `日期: ${label}`}
                formatter={(value: any) => [`${value} cm`, '身高']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="height" 
                stroke={selectedChart?.color} 
                strokeWidth={3}
                dot={{ fill: selectedChart?.color, strokeWidth: 2, r: 4 }}
                name="身高"
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'length':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formatted_date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: '体长 (cm)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(label) => `日期: ${label}`}
                formatter={(value: any) => [`${value} cm`, '体长']}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="length" 
                stroke={selectedChart?.color} 
                fill={selectedChart?.color}
                fillOpacity={0.6}
                name="体长"
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'chest_girth':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formatted_date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: '胸围 (cm)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(label) => `日期: ${label}`}
                formatter={(value: any) => [`${value} cm`, '胸围']}
              />
              <Legend />
              <Bar 
                dataKey="chest_girth" 
                fill={selectedChart?.color}
                name="胸围"
                opacity={0.8}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )

      case 'combined':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formatted_date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: '测量值', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} name="体重 (kg)" />
              <Line type="monotone" dataKey="height" stroke="#10B981" strokeWidth={2} name="身高 (cm)" />
              <Line type="monotone" dataKey="length" stroke="#F59E0B" strokeWidth={2} name="体长 (cm)" />
              <Line type="monotone" dataKey="chest_girth" stroke="#EF4444" strokeWidth={2} name="胸围 (cm)" />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'growth_rate':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formatted_date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: '增长率 (%)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(label) => `日期: ${label}`}
                formatter={(value: any) => [`${value}%`, '增长率']}
              />
              <Legend />
              <Bar dataKey="weight_rate" fill="#3B82F6" name="体重增长率" opacity={0.8} />
              <Line type="monotone" dataKey="height_rate" stroke="#10B981" strokeWidth={3} name="身高增长率" />
            </ComposedChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const calculateGrowthStats = () => {
    if (!chartData.length) return null

    const firstRecord = chartData[0]
    const lastRecord = chartData[chartData.length - 1]
    
    const stats = {
      weight: {
        start: firstRecord.weight,
        current: lastRecord.weight,
        change: lastRecord.weight && firstRecord.weight 
          ? (lastRecord.weight - firstRecord.weight).toFixed(1)
          : null
      },
      height: {
        start: firstRecord.height,
        current: lastRecord.height,
        change: lastRecord.height && firstRecord.height 
          ? (lastRecord.height - firstRecord.height).toFixed(1)
          : null
      }
    }

    return stats
  }

  const stats = calculateGrowthStats()
  const selectedDog = getSelectedDogInfo()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 顶部控制栏 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">成长曲线</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? `${selectedDog?.name} 的成长数据可视化` : '所有狗狗的成长趋势'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 时间范围选择 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          
          {/* 图表类型选择 */}
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            {CHART_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 成长统计卡片 */}
      {stats && selectedDogId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">当前体重</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.weight.current ? `${stats.weight.current} kg` : '--'}
            </div>
            {stats.weight.change && (
              <div className={`text-sm ${parseFloat(stats.weight.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(stats.weight.change) >= 0 ? '+' : ''}{stats.weight.change} kg
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">当前身高</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.height.current ? `${stats.height.current} cm` : '--'}
            </div>
            {stats.height.change && (
              <div className={`text-sm ${parseFloat(stats.height.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {parseFloat(stats.height.change) >= 0 ? '+' : ''}{stats.height.change} cm
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">记录数量</div>
            <div className="text-2xl font-bold text-purple-600">{chartData.length}</div>
            <div className="text-sm text-gray-400">条记录</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">跟踪时长</div>
            <div className="text-2xl font-bold text-orange-600">
              {chartData.length > 1 ? 
                Math.ceil((new Date(chartData[chartData.length - 1].date).getTime() - new Date(chartData[0].date).getTime()) / (1000 * 60 * 60 * 24))
                : 0
              }
            </div>
            <div className="text-sm text-gray-400">天</div>
          </div>
        </div>
      )}

      {/* 图表区域 */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="text-2xl mr-2">
              {CHART_TYPES.find(c => c.value === chartType)?.icon}
            </span>
            {CHART_TYPES.find(c => c.value === chartType)?.label}
          </h3>
        </div>
        
        {!selectedDogId ? (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">🐕</div>
              <p>请选择狗狗查看成长曲线</p>
            </div>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* 数据洞察 */}
      {chartData.length > 0 && selectedDogId && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            成长洞察
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">📈 成长趋势</h4>
              <ul className="space-y-1 text-gray-600">
                {stats?.weight.change && (
                  <li>
                    • 体重{parseFloat(stats.weight.change) >= 0 ? '增长' : '减少'}了 {Math.abs(parseFloat(stats.weight.change))} kg
                  </li>
                )}
                {stats?.height.change && (
                  <li>
                    • 身高{parseFloat(stats.height.change) >= 0 ? '增长' : '减少'}了 {Math.abs(parseFloat(stats.height.change))} cm
                  </li>
                )}
                <li>• 总共记录了 {chartData.length} 次成长数据</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">🎯 关键指标</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 平均{Math.ceil(chartData.length > 1 ? 
                  (new Date(chartData[chartData.length - 1].date).getTime() - new Date(chartData[0].date).getTime()) / (1000 * 60 * 60 * 24) / chartData.length
                  : 0)} 天记录一次</li>
                <li>• 数据跨度 {timeRange === 'all' ? '全部时间' : TIME_RANGES.find(r => r.value === timeRange)?.label}</li>
                <li>• 成长记录完整度良好</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 