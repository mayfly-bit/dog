'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Camera, Heart, Baby, User, Phone, Share2, Calendar, MapPin, Award } from 'lucide-react'

interface Dog {
  id: string
  name: string
  breed: string
  birth_date: string
  gender: string
  photo_urls?: string[]
  status?: string
  sire_id?: string
  dam_id?: string
  chip_number?: string
  notes?: string
  created_at: string
  user_id: string
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

interface UserProfile {
  id: string
  full_name?: string
  phone?: string
  email?: string
  address?: string
}

export default function DogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [owner, setOwner] = useState<UserProfile | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([])
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'health' | 'breeding' | 'photos'>('basic')

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
        breedingResult
      ] = await Promise.all([
        // 基本信息
        supabase.from('dogs').select('*').eq('id', dogId).single(),
        
        // 健康记录 - 获取疫苗、体检、治疗记录
        supabase
          .from('health_records')
          .select('*')
          .eq('dog_id', dogId)
          .order('date', { ascending: false })
          .limit(15),
        
        // 成长记录
        supabase
          .from('growth_records')
          .select('*')
          .eq('dog_id', dogId)
          .order('record_date', { ascending: false })
          .limit(10),
        
        // 繁殖记录 - 查看作为父母的记录
        supabase
          .from('litters')
          .select('*')
          .or(`mother_id.eq.${dogId},father_id.eq.${dogId}`)
          .order('mating_date', { ascending: false })
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

      // 获取主人信息
      if (dogResult.data.user_id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', dogResult.data.user_id)
          .single()
        
        if (userData) {
          setOwner(userData)
        }
      }

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
          date: litter.mating_date || litter.birth_date,
          partner_name: litter.mother_id === dogId ? '配偶(公)' : '配偶(母)',
          status: litter.birth_date ? '已分娩' : (litter.pregnancy_status || '配种'),
          notes: litter.notes,
          puppy_count: litter.puppy_count
        }))
        setBreedingRecords(breeding)
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

  const getStatusColor = (status?: string) => {
    const colors = {
      owned: 'bg-green-100 text-green-800',
      for_sale: 'bg-orange-100 text-orange-800',
      sold: 'bg-blue-100 text-blue-800',
      deceased: 'bg-gray-100 text-gray-800',
      returned: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status?: string) => {
    const labels = {
      owned: '拥有中',
      for_sale: '在售',
      sold: '已售出',
      deceased: '已过世',
      returned: '已退回'
    }
    return labels[status as keyof typeof labels] || '未知状态'
  }

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dog?.name} 的档案`,
          text: `查看 ${dog?.name}（${dog?.breed}）的详细档案`,
          url: window.location.href
        })
      } catch (error) {
        console.log('分享取消')
      }
    } else {
      // 复制链接
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载狗狗档案...</p>
        </div>
      </div>
    )
  }

  if (error || !dog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🐕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || '找不到狗狗档案'}
          </h1>
          <p className="text-gray-600 mb-6">
            请确认二维码信息是否正确，或联系狗主人
          </p>
          <button
            onClick={() => router.back()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* 头部 - 固定顶部 */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900 truncate mx-4">
              {dog.name} 的档案
            </h1>
            <button
              onClick={shareProfile}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline">分享</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 狗狗头像和基本信息 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 overflow-hidden relative">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-purple-100 rounded-bl-full opacity-50"></div>
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* 狗狗头像 */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl overflow-hidden shadow-lg">
                {dog.photo_urls && dog.photo_urls.length > 0 ? (
                  <img
                    src={dog.photo_urls[0]}
                    alt={dog.name}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedPhoto(dog.photo_urls![0])}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Camera className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>

            {/* 基本信息 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-3">
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{dog.name}</h2>
                <p className="text-xl text-gray-600 mb-2">{dog.breed}</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dog.status)}`}>
                    {getStatusLabel(dog.status)}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {dog.gender === 'male' ? '♂️ 公犬' : '♀️ 母犬'}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {calculateAge(dog.birth_date)}
                  </span>
                </div>
              </div>

              {/* 关键信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">出生</span>
                  <span className="font-medium">{formatDate(dog.birth_date)}</span>
                </div>
                {dog.chip_number && (
                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">芯片</span>
                    <span className="font-medium">{dog.chip_number}</span>
                  </div>
                )}
                {owner && (
                  <>
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">主人</span>
                      <span className="font-medium">{owner.full_name || '未填写'}</span>
                    </div>
                    {owner.phone && (
                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">联系</span>
                        <a href={`tel:${owner.phone}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {owner.phone}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 标签导航 */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b">
            {[
              { key: 'basic', label: '基本信息', icon: User },
              { key: 'health', label: '健康档案', icon: Heart },
              { key: 'breeding', label: '繁殖记录', icon: Baby },
              { key: 'photos', label: '照片', icon: Camera }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-2 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* 标签内容 */}
          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    详细信息
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">姓名</span>
                        <span className="font-medium">{dog.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">品种</span>
                        <span className="font-medium">{dog.breed}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">性别</span>
                        <span className="font-medium">{dog.gender === 'male' ? '公犬' : '母犬'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">出生日期</span>
                        <span className="font-medium">{formatDate(dog.birth_date)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">当前年龄</span>
                        <span className="font-medium">{calculateAge(dog.birth_date)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">状态</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dog.status)}`}>
                          {getStatusLabel(dog.status)}
                        </span>
                      </div>
                      {dog.chip_number && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600">芯片号</span>
                          <span className="font-medium">{dog.chip_number}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">档案创建</span>
                        <span className="font-medium">{formatDate(dog.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 主人信息 */}
                {owner && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-green-600" />
                      主人信息
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {owner.full_name && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">姓名:</span>
                            <span className="font-medium">{owner.full_name}</span>
                          </div>
                        )}
                        {owner.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">电话:</span>
                            <a href={`tel:${owner.phone}`} className="font-medium text-blue-600 hover:text-blue-700">
                              {owner.phone}
                            </a>
                          </div>
                        )}
                        {owner.address && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <span className="text-gray-600">地址:</span>
                            <span className="font-medium">{owner.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 备注信息 */}
                {dog.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">备注信息</h3>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-gray-700">{dog.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'health' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  健康档案
                  <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {healthRecords.length} 条记录
                  </span>
                </h3>
                
                {healthRecords.length > 0 ? (
                  <div className="space-y-4">
                    {healthRecords.map((record) => (
                      <div key={record.id} className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{record.type}</h4>
                          <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{record.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {record.veterinarian && (
                            <span>兽医: {record.veterinarian}</span>
                          )}
                          {record.cost && (
                            <span>费用: ¥{record.cost}</span>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">{record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">暂无健康记录</p>
                    <p className="text-sm">建议定期进行健康检查</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'breeding' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Baby className="h-5 w-5 mr-2 text-pink-600" />
                  繁殖记录
                  <span className="ml-2 text-sm bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
                    {breedingRecords.length} 条记录
                  </span>
                </h3>
                
                {breedingRecords.length > 0 ? (
                  <div className="space-y-4">
                    {breedingRecords.map((record) => (
                      <div key={record.id} className="bg-pink-50 border-l-4 border-pink-500 rounded-r-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{record.status}</h4>
                          <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                        </div>
                        <div className="space-y-1 text-gray-700">
                          <p>配偶: {record.partner_name}</p>
                          {record.puppy_count && (
                            <p>幼犬数量: {record.puppy_count} 只</p>
                          )}
                          {record.notes && (
                            <p className="text-sm italic">{record.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Baby className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">暂无繁殖记录</p>
                    <p className="text-sm">还没有参与繁殖活动</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'photos' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-purple-600" />
                  照片集
                  <span className="ml-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    {dog.photo_urls?.length || 0} 张
                  </span>
                </h3>
                
                {dog.photo_urls && dog.photo_urls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {dog.photo_urls.map((url, index) => (
                      <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden group cursor-pointer">
                        <img
                          src={url}
                          alt={`${dog.name} 照片 ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onClick={() => setSelectedPhoto(url)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">暂无照片</p>
                    <p className="text-sm">还没有上传照片</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 成长数据 (如果有的话) */}
        {growthRecords.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📊 成长数据
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {growthRecords.length} 条记录
              </span>
            </h3>
            
            <div className="space-y-3">
              {growthRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{formatDate(record.record_date)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
                    <p className="text-sm text-gray-600 mt-2">{record.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 照片查看模态框 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors z-10"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="查看大图"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
} 