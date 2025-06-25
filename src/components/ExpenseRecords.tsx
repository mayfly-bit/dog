'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ExpenseWithDog {
  id: string
  dog_id?: string
  category: 'medical' | 'food' | 'grooming' | 'breeding' | 'transport' | 'other'
  amount: number
  expense_date: string
  description?: string
  notes?: string
  created_at: string
  dogs?: {
    name: string
    breed: string
    gender: 'male' | 'female'
  }
}

export default function ExpenseRecords() {
  const [expenses, setExpenses] = useState<ExpenseWithDog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDog | null>(null)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          dogs:dog_id (
            name,
            breed,
            gender
          )
        `)
        .order('expense_date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('获取支出记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条支出记录吗？')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchExpenses()
    } catch (error) {
      console.error('删除支出记录失败:', error)
      alert('删除失败，请重试')
    }
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      medical: 'bg-red-100 text-red-800',
      food: 'bg-green-100 text-green-800',
      grooming: 'bg-pink-100 text-pink-800',
      breeding: 'bg-purple-100 text-purple-800',
      transport: 'bg-blue-100 text-blue-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">支出记录</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加支出记录</span>
        </button>
      </div>

      {/* 支出记录列表 */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">💸</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无支出记录
          </h3>
          <p className="text-gray-500 mb-6">
            开始添加您的第一条支出记录吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            添加支出记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {expense.description || '支出记录'}
                    </h3>
                    <span className={`px-2 py-1 text-sm rounded-full ${getCategoryColor(expense.category)}`}>
                      {getCategoryLabel(expense.category)}
                    </span>
                    {expense.dogs && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {expense.dogs.name}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">支出日期：</span>
                      <span className="font-medium">
                        {new Date(expense.expense_date).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">支出金额：</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">关联狗狗：</span>
                      <span className="font-medium">
                        {expense.dogs?.name || '无'}
                      </span>
                    </div>
                  </div>
                  
                  {expense.notes && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">备注：</span>
                      <span className="text-gray-700 text-sm ml-2">
                        {expense.notes}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setEditingExpense(expense)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑支出记录模态框 */}
      {(showAddModal || editingExpense) && (
        <AddExpenseModal
          expense={editingExpense}
          onClose={() => {
            setShowAddModal(false)
            setEditingExpense(null)
          }}
          onSuccess={() => {
            fetchExpenses()
            setShowAddModal(false)
            setEditingExpense(null)
          }}
        />
      )}
    </div>
  )
}

// 添加支出记录模态框组件
function AddExpenseModal({ 
  expense, 
  onClose, 
  onSuccess 
}: { 
  expense: ExpenseWithDog | null
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    dog_id: expense?.dog_id || '',
    category: expense?.category || 'other' as const,
    amount: expense?.amount || 0,
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    description: expense?.description || '',
    notes: expense?.notes || ''
  })
  const [dogs, setDogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAvailableDogs()
  }, [])

  const fetchAvailableDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, gender')
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
        ...formData,
        dog_id: formData.dog_id || null,
        user_id: user.id
      }

      if (expense) {
        // 更新现有记录
        const { error } = await supabase
          .from('expenses')
          .update(submitData)
          .eq('id', expense.id)

        if (error) throw error
      } else {
        // 创建新记录
        const { error } = await supabase
          .from('expenses')
          .insert([submitData])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存支出记录失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'medical', label: '医疗' },
    { value: 'food', label: '食物' },
    { value: 'grooming', label: '美容' },
    { value: 'breeding', label: '繁育' },
    { value: 'transport', label: '运输' },
    { value: 'other', label: '其他' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {expense ? '编辑支出记录' : '添加支出记录'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支出类别 *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                category: e.target.value as typeof formData.category 
              }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支出金额 *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              required
              min="0"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="输入支出金额"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支出日期 *
            </label>
            <input
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关联狗狗（可选）
            </label>
            <select
              value={formData.dog_id}
              onChange={(e) => setFormData(prev => ({ ...prev, dog_id: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">无关联狗狗</option>
              {dogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name} - {dog.breed} ({dog.gender === 'male' ? '公' : '母'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支出描述
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="输入支出描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="输入备注信息"
            />
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (expense ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 