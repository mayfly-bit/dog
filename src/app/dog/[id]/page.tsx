'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Dog {
  id: string
  name: string
  breed: string
  birth_date: string
  gender: string
  color: string
  weight?: number
  microchip_id?: string
  registration_number?: string
  owner_contact?: string
  notes?: string
  created_at: string
}

interface HealthRecord {
  id: string
  type: string
  date: string
  description: string
  veterinarian?: string
  cost?: number
  notes?: string
}

interface GrowthRecord {
  id: string
  date: string
  weight?: number
  height?: number
  chest_circumference?: number
  body_length?: number
  notes?: string
}

interface BreedingRecord {
  id: string
  type: 'mating' | 'pregnancy' | 'litter'
  date: string
  partner_name?: string
  status?: string
  notes?: string
  puppy_count?: number
}

interface FinanceRecord {
  id: string
  type: string
  amount: number
  date: string
  description: string
  category: string
}

export default function DogInfoPage() {
  const params = useParams()
  const [dog, setDog] = useState<Dog | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([])
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([])
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchDogInfo(params.id as string)
    }
  }, [params.id])

  const fetchDogInfo = async (dogId: string) => {
    try {
      // 并行获取所有相关数据
      const [
        dogResult,
        healthResult,
        growthResult,
        breedingResult,
        financeResult
      ] = await Promise.all([
        // 基本信息
        supabase.from('dogs').select('*').eq('id', dogId).single(),
        
        // 健康记录 - 获取疫苗、体检、治疗记录
        supabase
          .from('health_records')
          .select('*')
          .eq('dog_id', dogId)
          .order('date', { ascending: false })
          .limit(10),
        
        // 成长记录
        supabase
          .from('growth_records')
          .select('*')
          .eq('dog_id', dogId)
          .order('date', { ascending: false })
          .limit(10),
        
        // 繁殖记录 - 需要查看作为父母的记录
        Promise.all([
          supabase
            .from('litters')
            .select('*')
            .or(`mother_id.eq.${dogId},father_id.eq.${dogId}`)
            .order('mating_date', { ascending: false })
            .limit(5)
        ]),
        
        // 财务记录
        supabase
          .from('expenses')
          .select('*')
          .eq('dog_id', dogId)
          .order('date', { ascending: false })
          .limit(10)
      ])

      // 处理狗狗基本信息
      if (dogResult.error) {
        if (dogResult.error.code === 'PGRST116') {
          setError('找不到该狗狗信息')
        } else {
          throw dogResult.error
        }
        return
      }

      setDog(dogResult.data)

      // 处理健康记录
      if (healthResult.data) {
        setHealthRecords(healthResult.data)
      }

      // 处理成长记录
      if (growthResult.data) {
        setGrowthRecords(growthResult.data)
      }

      // 处理繁殖记录
      const [littersResult] = breedingResult
      if (littersResult.data) {
        const breeding = littersResult.data.map(litter => ({
          id: litter.id,
          type: 'litter' as const,
          date: litter.mating_date,
          partner_name: litter.mother_id === dogId ? '配偶(公)' : '配偶(母)',
          status: litter.birth_date ? '已分娩' : '怀孕中',
          notes: litter.notes,
          puppy_count: litter.puppy_count
        }))
        setBreedingRecords(breeding)
      }

      // 处理财务记录
      if (financeResult.data) {
        const finances = financeResult.data.map(expense => ({
          id: expense.id,
          type: expense.type,
          amount: expense.amount,
          date: expense.date,
          description: expense.description,
          category: expense.category
        }))
        setFinanceRecords(finances)
      }

    } catch (error) {
      console.error('获取狗狗信息失败:', error)
      setError('获取信息失败，请重试')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !dog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || '狗狗信息不存在'}
          </h1>
          <p className="text-gray-600 mb-6">
            请确认二维码是否正确，或联系管理员
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 头部区域 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {dog.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{dog.name}</h1>
              <p className="text-lg text-gray-600">{dog.breed}</p>
              <p className="text-sm text-blue-600">通过二维码扫描查看</p>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 概览统计 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{calculateAge(dog.birth_date)}</div>
            <div className="text-sm text-gray-600">当前年龄</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{healthRecords.length}</div>
            <div className="text-sm text-gray-600">健康记录</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{growthRecords.length}</div>
            <div className="text-sm text-gray-600">成长记录</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{breedingRecords.length}</div>
            <div className="text-sm text-gray-600">繁殖记录</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 基本信息卡片 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="text-2xl mr-2">🐕</span>
              基本信息
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600 font-medium">姓名</span>
                <span className="text-lg font-semibold text-gray-900">{dog.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600 font-medium">品种</span>
                <span className="text-gray-900">{dog.breed}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600 font-medium">性别</span>
                <span className="text-gray-900">
                  {dog.gender === 'male' ? '公' : '母'}
                  <span className="ml-2 text-2xl">
                    {dog.gender === 'male' ? '♂️' : '♀️'}
                  </span>
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600 font-medium">颜色</span>
                <span className="text-gray-900">{dog.color}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600 font-medium">出生日期</span>
                <span className="text-gray-900">{formatDate(dog.birth_date)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600 font-medium">当前年龄</span>
                <span className="text-lg font-semibold text-blue-600">
                  {calculateAge(dog.birth_date)}
                </span>
              </div>
              
              {dog.weight && (
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600 font-medium">体重</span>
                  <span className="text-gray-900">{dog.weight} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* 详细信息卡片 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              详细信息
            </h2>
            
            <div className="space-y-4">
              {dog.microchip_id && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-600">💾</span>
                    <span className="font-medium text-blue-800">芯片编号</span>
                  </div>
                  <p className="text-blue-900 font-mono text-lg">{dog.microchip_id}</p>
                </div>
              )}
              
              {dog.registration_number && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-600">📄</span>
                    <span className="font-medium text-green-800">注册编号</span>
                  </div>
                  <p className="text-green-900 font-mono text-lg">{dog.registration_number}</p>
                </div>
              )}
              
              {dog.owner_contact && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-purple-600">📞</span>
                    <span className="font-medium text-purple-800">联系方式</span>
                  </div>
                  <p className="text-purple-900 text-lg">{dog.owner_contact}</p>
                </div>
              )}
              
              {dog.notes && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-yellow-600">📝</span>
                    <span className="font-medium text-yellow-800">备注信息</span>
                  </div>
                  <p className="text-yellow-900">{dog.notes}</p>
                </div>
              )}
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-gray-600">⏰</span>
                  <span className="font-medium text-gray-800">录入时间</span>
                </div>
                <p className="text-gray-700">
                  {new Date(dog.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 健康记录 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-2xl mr-2">🏥</span>
            健康记录
            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {healthRecords.length} 条记录
            </span>
          </h2>
          
          {healthRecords.length > 0 ? (
            <div className="space-y-4">
              {healthRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{record.type}</h3>
                      <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                      {record.veterinarian && (
                        <p className="text-xs text-gray-500 mt-1">兽医: {record.veterinarian}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('zh-CN')}
                      </p>
                      {record.cost && (
                        <p className="text-xs text-gray-500">费用: ¥{record.cost}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {healthRecords.length > 5 && (
                <p className="text-center text-gray-500 text-sm py-2">
                  还有 {healthRecords.length - 5} 条健康记录...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏥</div>
              <p>暂无健康记录</p>
            </div>
          )}
        </div>

        {/* 成长记录 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-2xl mr-2">📈</span>
            成长记录
            <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
              {growthRecords.length} 条记录
            </span>
          </h2>
          
          {growthRecords.length > 0 ? (
            <div className="space-y-4">
              {growthRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('zh-CN')} 测量
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        {record.weight && (
                          <span className="text-gray-600">体重: <strong>{record.weight}kg</strong></span>
                        )}
                        {record.height && (
                          <span className="text-gray-600">身高: <strong>{record.height}cm</strong></span>
                        )}
                        {record.chest_circumference && (
                          <span className="text-gray-600">胸围: <strong>{record.chest_circumference}cm</strong></span>
                        )}
                        {record.body_length && (
                          <span className="text-gray-600">体长: <strong>{record.body_length}cm</strong></span>
                        )}
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {growthRecords.length > 5 && (
                <p className="text-center text-gray-500 text-sm py-2">
                  还有 {growthRecords.length - 5} 条成长记录...
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <p>暂无成长记录</p>
            </div>
          )}
        </div>

        {/* 繁殖记录 */}
        {breedingRecords.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="text-2xl mr-2">👶</span>
              繁殖记录
              <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {breedingRecords.length} 条记录
              </span>
            </h2>
            
            <div className="space-y-4">
              {breedingRecords.map((record) => (
                <div key={record.id} className="border-l-4 border-orange-500 pl-4 py-3 bg-orange-50 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {record.status} 
                        {record.puppy_count && ` - ${record.puppy_count}只幼犬`}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        配种日期: {new Date(record.date).toLocaleDateString('zh-CN')}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.status === '已分娩' 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 财务记录 */}
        {financeRecords.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="text-2xl mr-2">💰</span>
              相关费用
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {financeRecords.length} 条记录
              </span>
            </h2>
            
            <div className="space-y-4">
              {financeRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{record.description}</h3>
                      <p className="text-sm text-gray-600">
                        {record.category} | {new Date(record.date).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${
                        record.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.type === 'income' ? '+' : '-'}¥{record.amount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {financeRecords.length > 5 && (
                <p className="text-center text-gray-500 text-sm py-2">
                  还有 {financeRecords.length - 5} 条财务记录...
                </p>
              )}
            </div>
          </div>
        )}

        {/* 底部操作区域 */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">🔗</span>
            相关操作
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-blue-200 rounded-lg text-center hover:bg-blue-50 transition-colors">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="font-medium text-gray-900 mb-1">分享信息</h3>
              <p className="text-sm text-gray-600">
                将此页面链接分享给他人
              </p>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${dog.name} - 狗狗信息`,
                      text: `查看 ${dog.name} (${dog.breed}) 的详细信息`,
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('链接已复制到剪贴板')
                  }
                }}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                分享链接
              </button>
            </div>
            
            <div className="p-4 border border-green-200 rounded-lg text-center hover:bg-green-50 transition-colors">
              <div className="text-3xl mb-2">📞</div>
              <h3 className="font-medium text-gray-900 mb-1">联系主人</h3>
              <p className="text-sm text-gray-600">
                {dog.owner_contact ? '通过以下方式联系' : '暂无联系方式'}
              </p>
              {dog.owner_contact && (
                <a
                  href={`tel:${dog.owner_contact}`}
                  className="mt-2 inline-block text-green-600 text-sm hover:underline"
                >
                  拨打电话
                </a>
              )}
            </div>
            
            <div className="p-4 border border-purple-200 rounded-lg text-center hover:bg-purple-50 transition-colors">
              <div className="text-3xl mb-2">🏠</div>
              <h3 className="font-medium text-gray-900 mb-1">返回系统</h3>
              <p className="text-sm text-gray-600">
                访问完整的管理系统
              </p>
              <a
                href="/"
                className="mt-2 inline-block text-purple-600 text-sm hover:underline"
              >
                进入系统
              </a>
            </div>
          </div>
        </div>

        {/* 免责声明 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>此信息通过二维码扫描获取，由宠物繁育管理系统提供</p>
          <p className="mt-1">如有疑问请联系系统管理员</p>
        </div>
      </div>
    </div>
  )
} 