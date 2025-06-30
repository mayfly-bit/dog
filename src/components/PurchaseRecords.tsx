'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Purchase } from '@/types'

export default function PurchaseRecords() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          dogs:dog_id (
            name,
            breed,
            gender
          )
        `)
        .order('purchase_date', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('获取进货记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条进货记录吗？')) return

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPurchases()
    } catch (error) {
      console.error('删除进货记录失败:', error)
      alert('删除失败，请重试')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
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
        <h2 className="text-xl font-semibold text-gray-900">进货记录</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加进货记录</span>
        </button>
      </div>

      {/* 进货记录列表 */}
      {purchases.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无进货记录
          </h3>
          <p className="text-gray-500 mb-6">
            开始添加您的第一条进货记录吧
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加进货记录
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {purchase.dogs?.name || '未知狗狗'}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {purchase.dogs?.breed || '未知品种'}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      {purchase.dogs?.gender === 'male' ? '♂ 公' : '♀ 母'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">进货日期：</span>
                      <span className="font-medium">
                        {new Date(purchase.purchase_date).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">进货价格：</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(purchase.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">供应商：</span>
                      <span className="font-medium">
                        {purchase.supplier || '未填写'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">联系方式：</span>
                      <span className="font-medium">
                        {purchase.supplier_contact || '未填写'}
                      </span>
                    </div>
                  </div>
                  
                  {purchase.notes && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">备注：</span>
                      <span className="text-gray-700 text-sm ml-2">
                        {purchase.notes}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setEditingPurchase(purchase)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="编辑"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(purchase.id)}
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

      {/* 添加/编辑进货记录模态框 */}
      {(showAddModal || editingPurchase) && (
        <AddPurchaseModal
          purchase={editingPurchase}
          onClose={() => {
            setShowAddModal(false)
            setEditingPurchase(null)
          }}
          onSuccess={() => {
            fetchPurchases()
            setShowAddModal(false)
            setEditingPurchase(null)
          }}
        />
      )}
    </div>
  )
}

// 添加进货记录模态框组件
function AddPurchaseModal({ 
  purchase, 
  onClose, 
  onSuccess 
}: { 
  purchase: Purchase | null
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    dog_id: purchase?.dog_id || '',
    amount: purchase?.amount || 0,
    purchase_date: purchase?.purchase_date || new Date().toISOString().split('T')[0],
    supplier: purchase?.supplier || '',
    supplier_contact: purchase?.supplier_contact || '',
    notes: purchase?.notes || ''
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
        .select('id, name, breed, gender, status')
        .in('status', ['owned', 'for_sale'])  // 只显示"拥有中"和"在售"的狗狗，排除已售出的
        .order('name')

      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('获取可用狗狗列表失败:', error)
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
        user_id: user.id
      }

      if (purchase) {
        // 更新现有记录
        const { error } = await supabase
          .from('purchases')
          .update(submitData)
          .eq('id', purchase.id)

        if (error) throw error
      } else {
        // 创建新记录
        const { error } = await supabase
          .from('purchases')
          .insert([submitData])

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error('保存进货记录失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {purchase ? '编辑进货记录' : '添加进货记录'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择狗狗 *
            </label>
            <select
              value={formData.dog_id}
              onChange={(e) => setFormData(prev => ({ ...prev, dog_id: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">请选择狗狗</option>
              {dogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name} - {dog.breed} ({dog.gender === 'male' ? '公' : '母'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              进货价格 *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              required
              min="0"
              step="0.01"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入进货价格"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              进货日期 *
            </label>
            <input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              供应商
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入供应商名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              供应商联系方式
            </label>
            <input
              type="text"
              value={formData.supplier_contact}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_contact: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入联系方式"
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : (purchase ? '更新' : '添加')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 