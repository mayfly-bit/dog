'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Dog {
  id: string
  name: string
  breed: string
  gender: 'male' | 'female'
  birth_date?: string
  father_id?: string
  mother_id?: string
  father?: Dog
  mother?: Dog
}

interface PedigreeViewProps {
  selectedDogId: string
}

export default function PedigreeView({ selectedDogId }: PedigreeViewProps) {
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [pedigreeData, setPedigreeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDogs()
  }, [])

  useEffect(() => {
    if (selectedDogId && dogs.length > 0) {
      const dog = dogs.find(d => d.id === selectedDogId)
      if (dog) {
        setSelectedDog(dog)
        fetchPedigree(dog)
      }
    }
  }, [selectedDogId, dogs])

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取狗狗列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPedigree = async (dog: Dog) => {
    try {
      // 构建谱系树（3代）
      const pedigree = {
        dog: dog,
        parents: {
          father: null as Dog | null,
          mother: null as Dog | null
        },
        grandparents: {
          paternalGrandfather: null as Dog | null,
          paternalGrandmother: null as Dog | null,
          maternalGrandfather: null as Dog | null,
          maternalGrandmother: null as Dog | null
        }
      }

      // 获取父母信息
      if (dog.father_id) {
        const father = dogs.find(d => d.id === dog.father_id)
        if (father) {
          pedigree.parents.father = father
          
          // 获取父系祖父母
          if (father.father_id) {
            pedigree.grandparents.paternalGrandfather = dogs.find(d => d.id === father.father_id) || null
          }
          if (father.mother_id) {
            pedigree.grandparents.paternalGrandmother = dogs.find(d => d.id === father.mother_id) || null
          }
        }
      }

      if (dog.mother_id) {
        const mother = dogs.find(d => d.id === dog.mother_id)
        if (mother) {
          pedigree.parents.mother = mother
          
          // 获取母系祖父母
          if (mother.father_id) {
            pedigree.grandparents.maternalGrandfather = dogs.find(d => d.id === mother.father_id) || null
          }
          if (mother.mother_id) {
            pedigree.grandparents.maternalGrandmother = dogs.find(d => d.id === mother.mother_id) || null
          }
        }
      }

      setPedigreeData(pedigree)
    } catch (error) {
      console.error('获取谱系信息失败:', error)
    }
  }

  const DogCard = ({ dog, generation, position }: { dog: Dog | null, generation: number, position: string }) => {
    if (!dog) {
      return (
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm">
          <div className="text-2xl mb-2">❓</div>
          <div>未知</div>
          <div className="text-xs mt-1">{position}</div>
        </div>
      )
    }

    const getCardColor = () => {
      if (generation === 0) return 'bg-blue-50 border-blue-200 text-blue-900'
      if (generation === 1) return 'bg-green-50 border-green-200 text-green-900'
      if (generation === 2) return 'bg-purple-50 border-purple-200 text-purple-900'
      return 'bg-gray-50 border-gray-200 text-gray-900'
    }

    return (
      <div className={`border-2 rounded-lg p-4 text-center ${getCardColor()}`}>
        <div className="text-2xl mb-2">
          {dog.gender === 'male' ? '♂️' : '♀️'}
        </div>
        <div className="font-semibold text-sm mb-1">{dog.name}</div>
        <div className="text-xs opacity-75 mb-1">{dog.breed}</div>
        {dog.birth_date && (
          <div className="text-xs opacity-60">
            {new Date(dog.birth_date).getFullYear()}年
          </div>
        )}
        <div className="text-xs mt-2 opacity-60">{position}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">谱系管理</h2>
        
        {/* 狗狗选择器 */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择狗狗查看谱系
          </label>
          <select
            value={selectedDog?.id || ''}
            onChange={(e) => {
              const dog = dogs.find(d => d.id === e.target.value)
              if (dog) {
                setSelectedDog(dog)
                fetchPedigree(dog)
              }
            }}
            className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择狗狗</option>
            {dogs.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.name} - {dog.breed} ({dog.gender === 'male' ? '♂' : '♀'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 谱系图 */}
      {!selectedDog ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🌳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            选择狗狗查看谱系
          </h3>
          <p className="text-gray-500">
            选择一只狗狗来查看其家族谱系关系图
          </p>
        </div>
      ) : !pedigreeData ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            正在加载谱系信息...
          </h3>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedDog.name} 的家族谱系
            </h3>
            <p className="text-sm text-gray-500">
              显示三代谱系关系图
            </p>
          </div>

          {/* 谱系图布局 */}
          <div className="space-y-8">
            {/* 第一代 - 当前狗狗 */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-3">当前狗狗</div>
              <div className="flex justify-center">
                <div className="w-48">
                  <DogCard dog={selectedDog} generation={0} position="本犬" />
                </div>
              </div>
            </div>

            {/* 第二代 - 父母 */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-3">父母一代</div>
              <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                <DogCard dog={pedigreeData.parents.father} generation={1} position="父亲" />
                <DogCard dog={pedigreeData.parents.mother} generation={1} position="母亲" />
              </div>
            </div>

            {/* 第三代 - 祖父母 */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-3">祖父母一代</div>
              <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
                <DogCard dog={pedigreeData.grandparents.paternalGrandfather} generation={2} position="父系祖父" />
                <DogCard dog={pedigreeData.grandparents.paternalGrandmother} generation={2} position="父系祖母" />
                <DogCard dog={pedigreeData.grandparents.maternalGrandfather} generation={2} position="母系祖父" />
                <DogCard dog={pedigreeData.grandparents.maternalGrandmother} generation={2} position="母系祖母" />
              </div>
            </div>
          </div>

          {/* 谱系信息汇总 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">血统信息</h4>
              <div className="text-sm text-blue-800">
                <div>品种: {selectedDog.breed}</div>
                <div>性别: {selectedDog.gender === 'male' ? '公犬' : '母犬'}</div>
                {selectedDog.birth_date && (
                  <div>出生: {new Date(selectedDog.birth_date).toLocaleDateString('zh-CN')}</div>
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">父系血统</h4>
              <div className="text-sm text-green-800">
                <div>父亲: {pedigreeData.parents.father?.name || '未知'}</div>
                <div>祖父: {pedigreeData.grandparents.paternalGrandfather?.name || '未知'}</div>
                <div>祖母: {pedigreeData.grandparents.paternalGrandmother?.name || '未知'}</div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">母系血统</h4>
              <div className="text-sm text-purple-800">
                <div>母亲: {pedigreeData.parents.mother?.name || '未知'}</div>
                <div>外祖父: {pedigreeData.grandparents.maternalGrandfather?.name || '未知'}</div>
                <div>外祖母: {pedigreeData.grandparents.maternalGrandmother?.name || '未知'}</div>
              </div>
            </div>
          </div>

          {/* 后代信息 */}
          <OffspringInfo dogId={selectedDog.id} />
        </div>
      )}
    </div>
  )
}

// 后代信息组件
function OffspringInfo({ dogId }: { dogId: string }) {
  const [offspring, setOffspring] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOffspring()
  }, [dogId])

  const fetchOffspring = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .or(`father_id.eq.${dogId},mother_id.eq.${dogId}`)
        .order('birth_date', { ascending: false })

      if (error) throw error
      setOffspring(data || [])
    } catch (error) {
      console.error('获取后代信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
          ))}
        </div>
      </div>
    )
  }

  if (offspring.length === 0) {
    return (
      <div className="mt-8">
        <h4 className="font-medium text-gray-900 mb-3">后代信息</h4>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
          暂无后代记录
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h4 className="font-medium text-gray-900 mb-3">
        后代信息 ({offspring.length} 只)
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {offspring.map((dog) => (
          <div key={dog.id} className="bg-gray-50 border rounded-lg p-3 text-center">
            <div className="text-lg mb-1">
              {dog.gender === 'male' ? '♂️' : '♀️'}
            </div>
            <div className="font-medium text-sm">{dog.name}</div>
            <div className="text-xs text-gray-600">{dog.breed}</div>
            {dog.birth_date && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(dog.birth_date).toLocaleDateString('zh-CN')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 