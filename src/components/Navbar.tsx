'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { 
  Home, 
  Dog, 
  DollarSign, 
  Heart, 
  FileText,
  TrendingUp,
  QrCode,
  Bot,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'

const navigation = [
  { name: '首页', href: '/', icon: Home },
  { name: '狗狗管理', href: '/dogs', icon: Dog },
  { name: '财务管理', href: '/finance', icon: DollarSign },
  { name: '健康记录', href: '/health', icon: Heart },
  { name: '繁殖记录', href: '/breeding', icon: FileText },
  { name: '成长档案', href: '/growth', icon: TrendingUp },
  { name: 'AI分析', href: '/analysis', icon: Bot },
  { name: '二维码', href: '/qrcode', icon: QrCode },
]

export default function Navbar() {
  const { user, setUser, setDogs } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDogs([])
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Dog className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              宠物繁育管理
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </a>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-gray-700">
                {user?.full_name || user?.email}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>退出</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-primary-600 p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </a>
                )
              })}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-700 hover:text-red-600 w-full px-3 py-2 rounded-md text-base font-medium text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>退出</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 