'use client'

import { useEffect, useState, Suspense, memo } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import Navbar from '@/components/Navbar'
import DashboardStats from '@/components/DashboardStats'
import DogList from '@/components/DogList'
import LoginModal from '@/components/LoginModal'

// 加载组件 - 优化版本
const LoadingFallback = memo(({ message = "加载中..." }: { message?: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
))

LoadingFallback.displayName = 'LoadingFallback'

// 错误边界组件
const ErrorBoundary = memo(({ children, fallback }: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) => {
  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  )
})

ErrorBoundary.displayName = 'ErrorBoundary'

// 快速操作面板
const QuickActions = memo(() => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <a
        href="/qrcode"
        className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
          <span className="text-2xl">📱</span>
        </div>
        <span className="text-sm font-medium text-gray-900">二维码</span>
        <span className="text-xs text-gray-500 text-center">生成狗狗二维码</span>
      </a>
      
      <a
        href="/health"
        className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
          <span className="text-2xl">🏥</span>
        </div>
        <span className="text-sm font-medium text-gray-900">健康记录</span>
        <span className="text-xs text-gray-500 text-center">管理健康档案</span>
      </a>
      
      <a
        href="/growth"
        className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-purple-200 transition-colors">
          <span className="text-2xl">📈</span>
        </div>
        <span className="text-sm font-medium text-gray-900">成长档案</span>
        <span className="text-xs text-gray-500 text-center">记录成长数据</span>
      </a>
      
      <a
        href="/finance"
        className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
          <span className="text-2xl">💰</span>
        </div>
        <span className="text-sm font-medium text-gray-900">财务管理</span>
        <span className="text-xs text-gray-500 text-center">记录收支情况</span>
      </a>
    </div>
  </div>
))

QuickActions.displayName = 'QuickActions'

// 欢迎横幅
const WelcomeBanner = memo(() => (
  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white p-6 mb-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          欢迎回到宠物繁育管理系统
        </h1>
        <p className="text-blue-100">
          专业的宠物繁育管理平台，让您的繁育事业更加高效有序
        </p>
      </div>
      <div className="hidden md:block text-6xl opacity-20">
        🐕
      </div>
    </div>
  </div>
))

WelcomeBanner.displayName = 'WelcomeBanner'

export default function Home() {
  const { user, setUser, dogs, setDogs, loading, setLoading } = useStore()
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    // 检查用户认证状态
    const checkUser = async () => {
      setLoading(true)
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user) {
          setUser({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
            created_at: user.created_at!,
          })
          await loadDogs()
        } else if (error) {
          console.error('认证错误:', error)
          setShowLogin(true)
        } else {
          setShowLogin(true)
        }
      } catch (error) {
        console.error('用户检查失败:', error)
        setShowLogin(true)
      } finally {
        setLoading(false)
      }
    }

    const loadDogs = async () => {
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setDogs(data || [])
      } catch (error) {
        console.error('加载狗狗数据失败:', error)
      }
    }

    checkUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at!,
          })
          setShowLogin(false)
          await loadDogs()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setDogs([])
          setShowLogin(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container-custom py-8">
        {/* 欢迎横幅 */}
        <WelcomeBanner />
        
        {/* 统计数据 - 使用 Suspense 包装 */}
        <div className="mb-8">
          <ErrorBoundary fallback={<LoadingFallback message="加载统计数据..." />}>
            <DashboardStats />
          </ErrorBoundary>
        </div>

        {/* 快速操作面板 */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* 狗狗列表 - 使用 Suspense 包装 */}
        <div>
          <ErrorBoundary fallback={<LoadingFallback message="加载狗狗列表..." />}>
            <DogList />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
} 