'use client'

import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar, Eye, Edit, Trash2 } from 'lucide-react'
import type { Dog } from '@/types'

interface DogCardProps {
  dog: Dog
}

const statusLabels = {
  owned: '拥有中',
  sold: '已售出', 
  deceased: '已过世',
  returned: '已退回'
}

const statusColors = {
  owned: 'bg-green-100 text-green-800',
  sold: 'bg-blue-100 text-blue-800',
  deceased: 'bg-gray-100 text-gray-800',
  returned: 'bg-yellow-100 text-yellow-800'
}

export default function DogCard({ dog }: DogCardProps) {
  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - birth.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays}天`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months}个月`
    } else {
      const years = Math.floor(diffDays / 365)
      const months = Math.floor((diffDays % 365) / 30)
      return months > 0 ? `${years}岁${months}个月` : `${years}岁`
    }
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* 狗狗照片 */}
      <div className="relative h-48 bg-gray-200 rounded-lg overflow-hidden mb-4">
        {dog.photo_urls && dog.photo_urls.length > 0 ? (
          <img
            src={dog.photo_urls[0]}
            alt={dog.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21,17H7V3A1,1 0 0,1 8,2H20A1,1 0 0,1 21,3V17M19,15V4H9V15H19M3,5V21A1,1 0 0,0 4,22H18A1,1 0 0,0 19,21V19H5V7H3V5Z"/>
            </svg>
          </div>
        )}
        
        {/* 状态标签 */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[dog.status || 'owned']}`}>
            {statusLabels[dog.status || 'owned']}
          </span>
        </div>
      </div>

      {/* 狗狗信息 */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{dog.name}</h3>
          <p className="text-sm text-gray-600">{dog.breed}</p>
        </div>

        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span>
            {format(new Date(dog.birth_date), 'yyyy年MM月dd日', { locale: zhCN })}
            ({getAge(dog.birth_date)})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {dog.gender === 'male' ? '♂ 公' : '♀ 母'}
          </span>
          
          <div className="flex space-x-2">
            <button
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
              title="查看详情"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="编辑"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 谱系信息 */}
        {(dog.sire_id || dog.dam_id) && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {dog.sire_id && <span>父: {dog.sire_id}</span>}
              {dog.sire_id && dog.dam_id && <span className="mx-2">•</span>}
              {dog.dam_id && <span>母: {dog.dam_id}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 