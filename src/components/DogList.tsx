'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import AddDogModal from './AddDogModal'
import { Trash2, Edit, Plus, Search, Filter } from 'lucide-react'
import type { Dog } from '@/types'

// 优化的狗狗卡片组件
const DogCard = memo(({ dog, onEdit, onDelete }: {
  dog: Dog
  onEdit: (dog: Dog) => void
  onDelete: (dog: Dog) => void
}) => {
  const calculateAge = useCallback((birthDate: string) => {
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
  }, [])

  const handleEdit = useCallback(() => onEdit(dog), [dog, onEdit])
  const handleDelete = useCallback(() => onDelete(dog), [dog, onDelete])

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {dog.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{dog.name}</h3>
            <p className="text-gray-600 mt-1">{dog.breed}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>
                {dog.gender === 'male' ? '♂️ 公' : '♀️ 母'}
              </span>
              <span>{dog.color}</span>
              <span>{calculateAge(dog.birth_date)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        {dog.weight && (
          <div className="flex justify-between">
            <span className="text-gray-500">体重:</span>
            <span className="font-medium">{dog.weight} kg</span>
          </div>
        )}
        {dog.microchip_id && (
          <div className="flex justify-between">
            <span className="text-gray-500">芯片:</span>
            <span className="font-medium font-mono text-xs">{dog.microchip_id}</span>
          </div>
        )}
      </div>
    </div>
  )
})

DogCard.displayName = 'DogCard'

// 骨架屏组件
const SkeletonCard = memo(() => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="flex space-x-4">
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-14"></div>
          </div>
        </div>
      </div>
      <div className="flex space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
))

SkeletonCard.displayName = 'SkeletonCard'

export default function DogList() {
  const { dogs, setDogs } = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDog, setEditingDog] = useState<Dog | null>(null)
  
  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all')
  const [breedFilter, setBreedFilter] = useState('')

  // 缓存数据获取
  const fetchDogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      
      setDogs(data || [])
    } catch (err: any) {
      console.error('获取狗狗列表失败:', err)
      setError('获取狗狗列表失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [setDogs])

  useEffect(() => {
    fetchDogs()
  }, [fetchDogs])

  // 优化的筛选逻辑
  const filteredDogs = useMemo(() => {
    return dogs.filter(dog => {
      const matchesSearch = searchTerm === '' || 
        dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dog.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dog.microchip_id?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesGender = genderFilter === 'all' || dog.gender === genderFilter
      
      const matchesBreed = breedFilter === '' || 
        dog.breed.toLowerCase().includes(breedFilter.toLowerCase())
      
      return matchesSearch && matchesGender && matchesBreed
    })
  }, [dogs, searchTerm, genderFilter, breedFilter])

  // 获取品种列表用于筛选
  const breeds = useMemo(() => {
    const uniqueBreeds = Array.from(new Set(dogs.map(dog => dog.breed)))
    return uniqueBreeds.sort()
  }, [dogs])

  const handleEdit = useCallback((dog: Dog) => {
    // TODO: 实现编辑功能
    alert(`编辑功能开发中... 选中的狗狗: ${dog.name}`)
  }, [])

  const handleDelete = useCallback(async (dog: Dog) => {
    if (!confirm(`确定要删除 ${dog.name} 吗？此操作不可撤销。`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dog.id)

      if (error) throw error

      setDogs(dogs.filter(d => d.id !== dog.id))
      alert('删除成功')
    } catch (err: any) {
      console.error('删除失败:', err)
      alert('删除失败，请重试')
    }
  }, [dogs, setDogs])

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setEditingDog(null)
    fetchDogs() // 重新获取数据
  }, [fetchDogs])

  // 清除筛选条件
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setGenderFilter('all')
    setBreedFilter('')
  }, [])

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">❌ {error}</div>
        <button
          onClick={fetchDogs}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新加载
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 - 优化布局 */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">狗狗管理</h2>
            <p className="text-gray-600 mt-1">
              共 {dogs.length} 只狗狗 
              {filteredDogs.length !== dogs.length && (
                <span className="text-blue-600">，筛选出 {filteredDogs.length} 只</span>
              )}
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus className="h-5 w-5" />
            <span>添加狗狗</span>
          </button>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="搜索狗狗名字、品种、芯片号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as 'all' | 'male' | 'female')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">所有性别</option>
            <option value="male">公犬</option>
            <option value="female">母犬</option>
          </select>

          <select
            value={breedFilter}
            onChange={(e) => setBreedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有品种</option>
            {breeds.map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>清除筛选</span>
          </button>
        </div>
      </div>

      {/* 狗狗列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          // 骨架屏
          Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))
        ) : filteredDogs.length > 0 ? (
          filteredDogs.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🐕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || genderFilter !== 'all' || breedFilter ? '没有找到匹配的狗狗' : '还没有狗狗信息'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || genderFilter !== 'all' || breedFilter 
                ? '试试调整搜索条件或清除筛选'
                : '点击上方按钮添加第一只狗狗吧！'
              }
            </p>
            {(searchTerm || genderFilter !== 'all' || breedFilter) && (
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                清除筛选条件
              </button>
            )}
          </div>
        )}
      </div>

      {/* 添加狗狗模态框 */}
      <AddDogModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  )
} 