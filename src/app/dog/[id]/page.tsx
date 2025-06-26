'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Camera, Heart, TrendingUp, Wallet, Calendar } from 'lucide-react'

interface Dog {
  id: string
  name: string
  breed: string
  birth_date: string
  gender: string
  photo_urls?: string[]
  status?: string
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
  record_date: string
  weight?: number
  height?: number
  chest_girth?: number
  length?: number
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

interface GrowthPhoto {
  id: string
  photo_url: string
  photo_date: string
  caption?: string
  age_in_days?: number
}

export default function DogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([])
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([])
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([])
  const [growthPhotos, setGrowthPhotos] = useState<GrowthPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

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
        financeResult,
        photosResult
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
          .order('record_date', { ascending: false })
          .limit(10),
        
        // 繁殖记录 - 需要查看作为父母的记录
        supabase
          .from('litters')
          .select('*')
          .or(`mother_id.eq.${dogId},father_id.eq.${dogId}`)
          .order('mating_date', { ascending: false })
          .limit(5),
        
        // 财务记录
        supabase
          .from('expenses')
          .select('*')
          .eq('dog_id', dogId)
          .order('date', { ascending: false })
          .limit(20),

        // 成长照片
        supabase
          .from('growth_photos')
          .select('*')
          .eq('dog_id', dogId)
          .order('photo_date', { ascending: false })
          .limit(20)
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
      if (breedingResult.data) {
        const breeding = breedingResult.data.map(litter => ({
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

      // 处理成长照片
      if (photosResult.data) {
        setGrowthPhotos(photosResult.data)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  const getTotalExpenses = () => {
    return financeRecords.reduce((total, record) => {
      return record.type === 'expense' ? total + record.amount : total - record.amount
    }, 0)
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
            请确认信息是否正确，或联系管理员
          </p>
          <button
            onClick={() => router.back()}
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
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{dog.name} 的详细档案</h1>
            <div></div> {/* 占位符保持布局平衡 */}
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 狗狗基本信息卡片 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
            {/* 狗狗照片区域 */}
            <div className="lg:w-1/3 mb-6 lg:mb-0">
              <div className="space-y-4">
                {/* 主要照片 */}
                <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden">
                  {dog.photo_urls && dog.photo_urls.length > 0 ? (
                    <img
                      src={dog.photo_urls[0]}
                      alt={dog.name}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setSelectedPhoto(dog.photo_urls![0])}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-16 h-16" />
                    </div>
                  )}
                </div>
                
                {/* 照片缩略图 */}
                {dog.photo_urls && dog.photo_urls.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {dog.photo_urls.slice(1, 4).map((url, index) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={url}
                          alt={`${dog.name} ${index + 2}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setSelectedPhoto(url)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 基本信息 */}
            <div className="lg:w-2/3">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {dog.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{dog.name}</h2>
                  <p className="text-xl text-gray-600">{dog.breed}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {dog.gender === 'male' ? '♂️ 公犬' : '♀️ 母犬'} • {calculateAge(dog.birth_date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-600">{calculateAge(dog.birth_date)}</div>
                  <div className="text-sm text-gray-600">当前年龄</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Heart className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-600">{healthRecords.length}</div>
                  <div className="text-sm text-gray-600">健康记录</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-600">{growthRecords.length}</div>
                  <div className="text-sm text-gray-600">成长记录</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <Wallet className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-orange-600">{formatCurrency(getTotalExpenses())}</div>
                  <div className="text-sm text-gray-600">总花费</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">出生日期</span>
                    <span className="font-medium">{formatDate(dog.birth_date)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">状态</span>
                    <span className="font-medium">{dog.status || 'owned'}</span>
                  </div>
                </div>
                
                {dog.notes && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">备注信息</h4>
                    <p className="text-gray-700">{dog.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 标签式内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 成长照片展示 */}
          {growthPhotos.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Camera className="h-6 w-6 mr-2 text-pink-600" />
                成长照片
                <span className="ml-2 text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                  {growthPhotos.length} 张
                </span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {growthPhotos.slice(0, 6).map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={photo.photo_url}
                        alt={photo.caption || '成长照片'}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setSelectedPhoto(photo.photo_url)}
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="truncate">{formatDate(photo.photo_date)}</p>
                      {photo.caption && (
                        <p className="truncate">{photo.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {growthPhotos.length > 6 && (
                <p className="text-center text-gray-500 text-sm mt-4">
                  还有 {growthPhotos.length - 6} 张照片...
                </p>
              )}
            </div>
          )}

          {/* 花费明细 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Wallet className="h-6 w-6 mr-2 text-orange-600" />
              花费明细
              <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {financeRecords.length} 条记录
              </span>
            </h3>
            
            {financeRecords.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {financeRecords.map((record) => (
                  <div key={record.id} className="border-l-4 border-orange-500 pl-4 py-3 bg-orange-50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{record.description}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {record.category} • {formatDate(record.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-semibold ${
                          record.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {record.type === 'expense' ? '-' : '+'}{formatCurrency(record.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无花费记录</p>
              </div>
            )}
          </div>
        </div>

        {/* 健康记录和成长记录 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* 健康记录 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-green-600" />
              健康记录
              <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {healthRecords.length} 条记录
              </span>
            </h3>
            
            {healthRecords.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {healthRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{record.type}</h4>
                        <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                        {record.veterinarian && (
                          <p className="text-xs text-gray-500 mt-1">兽医: {record.veterinarian}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(record.date)}
                        </p>
                        {record.cost && (
                          <p className="text-xs text-gray-500">费用: {formatCurrency(record.cost)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无健康记录</p>
              </div>
            )}
          </div>

          {/* 成长记录 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-purple-600" />
              成长记录
              <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {growthRecords.length} 条记录
              </span>
            </h3>
            
            {growthRecords.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {growthRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {formatDate(record.record_date)} 测量
                        </h4>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          {record.weight && (
                            <span className="text-gray-600">体重: <strong>{record.weight}kg</strong></span>
                          )}
                          {record.height && (
                            <span className="text-gray-600">身高: <strong>{record.height}cm</strong></span>
                          )}
                          {record.chest_girth && (
                            <span className="text-gray-600">胸围: <strong>{record.chest_girth}cm</strong></span>
                          )}
                          {record.length && (
                            <span className="text-gray-600">体长: <strong>{record.length}cm</strong></span>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无成长记录</p>
              </div>
            )}
          </div>
        </div>

        {/* 繁殖记录 */}
        {breedingRecords.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-pink-600" />
              繁殖记录
              <span className="ml-2 text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                {breedingRecords.length} 条记录
              </span>
            </h3>
            
            <div className="space-y-4">
              {breedingRecords.map((record) => (
                <div key={record.id} className="border-l-4 border-pink-500 pl-4 py-3 bg-pink-50 rounded-r-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {record.partner_name} - {record.status}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(record.date)}</p>
                      {record.puppy_count && (
                        <p className="text-sm text-gray-600">幼犬数量: {record.puppy_count}</p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 照片查看模态框 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-colors z-10"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="查看大图"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
} 