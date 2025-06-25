'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRCodeBatchPrint from '@/components/QRCodeBatchPrint'

export default function QRCodePage() {
  const [activeTab, setActiveTab] = useState('generator')

  const tabs = [
    { id: 'generator', label: '二维码生成', icon: '📱', description: '为狗狗生成专属二维码' },
    { id: 'batch', label: '批量打印', icon: '🖨️', description: '批量生成打印二维码' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generator':
        return <QRCodeGenerator />
      case 'batch':
        return <QRCodeBatchPrint />
      default:
        return <QRCodeGenerator />
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            二维码管理
          </h1>
          <p className="text-gray-600">
            为每只狗狗生成专属二维码，方便分享和管理信息
          </p>
        </div>
        
        {/* 标签页导航 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-1 text-center font-medium focus:z-10 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {tab.description}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>
        
        {/* 标签页内容 */}
        <div>
          {renderTabContent()}
        </div>
      </main>
    </div>
  )
} 