'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface GrowthLog {
  id: string
  dog_id: string
  log_date: string
  log_type: string
  title: string
  content: string
  mood?: string
  created_at: string
}

interface GrowthLogsProps {
  selectedDogId: string
}

const LOG_TYPES = [
  { value: 'behavior', label: '行为观察', icon: '🧠', color: 'bg-blue-100 text-blue-800' },
  { value: 'training', label: '训练记录', icon: '🎯', color: 'bg-green-100 text-green-800' },
  { value: 'health', label: '健康状况', icon: '❤️‍🩹', color: 'bg-red-100 text-red-800' },
  { value: 'diet', label: '饮食记录', icon: '🍽️', color: 'bg-orange-100 text-orange-800' },
  { value: 'play', label: '玩耍活动', icon: '🎾', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'sleep', label: '睡眠情况', icon: '😴', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'social', label: '社交活动', icon: '👥', color: 'bg-purple-100 text-purple-800' },
  { value: 'general', label: '日常记录', icon: '📝', color: 'bg-gray-100 text-gray-800' }
]

const MOODS = [
  { value: 'happy', label: '开心', icon: '😄', color: 'text-yellow-500' },
  { value: 'active', label: '活跃', icon: '⚡', color: 'text-orange-500' },
  { value: 'calm', label: '平静', icon: '😌', color: 'text-blue-500' },
  { value: 'tired', label: '疲惫', icon: '😴', color: 'text-gray-500' },
  { value: 'excited', label: '兴奋', icon: '🤩', color: 'text-pink-500' },
  { value: 'anxious', label: '焦虑', icon: '😰', color: 'text-purple-500' },
  { value: 'sick', label: '不适', icon: '🤒', color: 'text-red-500' },
  { value: 'playful', label: '顽皮', icon: '😜', color: 'text-green-500' }
]

export default function GrowthLogs({ selectedDogId }: GrowthLogsProps) {
  const [logs, setLogs] = useState<GrowthLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLog, setEditingLog] = useState<GrowthLog | null>(null)
  const [filterType, setFilterType] = useState<string>('')

  useEffect(() => {
    fetchLogs()
  }, [selectedDogId, filterType])

  const fetchLogs = async () => {
    try {
      let query = supabase
        .from('growth_logs')
        .select('*')
        .order('log_date', { ascending: false })

      if (selectedDogId) {
        query = query.eq('dog_id', selectedDogId)
      }

      if (filterType) {
        query = query.eq('log_type', filterType)
      }

      const { data, error } = await query
      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('获取成长日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条日志吗？')) return

    try {
      const { error } = await supabase
        .from('growth_logs')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchLogs()
    } catch (error) {
      console.error('删除日志失败:', error)
      alert('删除失败，请重试')
    }
  }

  const getLogTypeInfo = (type: string) => {
    return LOG_TYPES.find(t => t.value === type) || LOG_TYPES[LOG_TYPES.length - 1]
  }

  const getMoodInfo = (mood?: string) => {
    if (!mood) return null
    return MOODS.find(m => m.value === mood)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">成长日志</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedDogId ? '记录狗狗的日常成长点滴' : '所有狗狗的成长日志'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* 类型筛选 */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          >
            <option value="">所有类型</option>
            {LOG_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 whitespace-nowrap"
          >
            <span>+</span>
            <span>写日志</span>
          </button>
        </div>
      </div>

      {/* 日志列表 */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterType ? '暂无此类型的日志' : '暂无成长日志'}
          </h3>
          <p className="text-gray-500 mb-6">
            开始记录狗狗的成长日记吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            写第一篇日志
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log) => {
            const typeInfo = getLogTypeInfo(log.log_type)
            const moodInfo = getMoodInfo(log.mood)
            return (
              <article key={log.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* 日志头部 */}
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 text-sm rounded-full ${typeInfo.color} flex items-center space-x-1`}>
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </span>
                      
                      {moodInfo && (
                        <span className={`text-lg ${moodInfo.color} flex items-center space-x-1`} title={moodInfo.label}>
                          <span>{moodInfo.icon}</span>
                          <span className="text-sm text-gray-600">{moodInfo.label}</span>
                        </span>
                      )}
                      
                      <time className="text-sm text-gray-500">
                        {formatDate(log.log_date)}
                      </time>
                    </div>
                    
                    {/* 日志标题 */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {log.title}
                    </h3>
                    
                    {/* 日志内容 */}
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {log.content}
                    </div>
                    
                    {/* 创建时间 */}
                    <div className="mt-4 text-xs text-gray-400">
                      创建于 {formatTime(log.created_at)}
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingLog(log)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="编辑"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* 添加/编辑日志模态框 */}
      {(showAddModal || editingLog) && (
        <AddLogModal
          log={editingLog}
          selectedDogId={selectedDogId}
          onClose={() => {
            setShowAddModal(false)
            setEditingLog(null)
          }}
          onSuccess={() => {
            fetchLogs()
            setShowAddModal(false)
            setEditingLog(null)
          }}
        />
      )}
    </div>
  )
}

// 添加日志模态框组件
function AddLogModal({ 
  log, 
  selectedDogId,
  onClose, 
  onSuccess 
}: { 
  log: GrowthLog | null
  selectedDogId: string
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    dog_id: log?.dog_id || selectedDogId || '',
    log_date: log?.log_date || new Date().toISOString().split('T')[0],
    log_type: log?.log_type || 'general',
    title: log?.title || '',
    content: log?.content || '',
    mood: log?.mood || ''
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!log) {
      fetchDogs()
    }
  }, [log])

  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed')
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取狗狗列表失败:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('请先登录')
        return
      }

      const submitData = {
        user_id: user.id,
        dog_id: formData.dog_id,
        log_date: formData.log_date,
        log_type: formData.log_type,
        title: formData.title,
        content: formData.content,
        mood: formData.mood || null
      }

      if (log) {
        // 更新现有日志
        const { error } = await supabase
          .from('growth_logs')
          .update(submitData)
          .eq('id', log.id)

        if (error) throw error
      } else {
        // 创建新日志
        const { error } = await supabase
          .from('growth_logs')
          .insert([submitData])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存日志失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {log ? '编辑成长日志' : '写成长日志'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!log && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择狗狗 *
              </label>
              <select
                value={formData.dog_id}
                onChange={(e) => setFormData(prev => ({ ...prev, dog_id: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">请选择狗狗</option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name} - {dog.breed}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期 *
              </label>
              <input
                type="date"
                value={formData.log_date}
                onChange={(e) => setFormData(prev => ({ ...prev, log_date: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日志类型 *
              </label>
              <select
                value={formData.log_type}
                onChange={(e) => setFormData(prev => ({ ...prev, log_type: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {LOG_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              心情（可选）
            </label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">选择心情</option>
              {MOODS.map((mood) => (
                <option key={mood.value} value={mood.value}>
                  {mood.icon} {mood.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日志标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="给这条日志起个标题..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日志内容 *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              required
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="记录今天发生的有趣事情、观察到的行为变化、训练进展等..."
            />
            <p className="text-xs text-gray-500 mt-1">
              详细记录狗狗今天的表现、行为、健康状况等
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (log ? '更新日志' : '发布日志')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 