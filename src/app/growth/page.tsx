'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import GrowthStats from '@/components/GrowthStats'
import GrowthTabs from '@/components/GrowthTabs'
import GrowthRecords from '@/components/GrowthRecords'
import GrowthMilestones from '@/components/GrowthMilestones'
import GrowthPhotos from '@/components/GrowthPhotos'
import GrowthLogs from '@/components/GrowthLogs'
import GrowthCharts from '@/components/GrowthCharts'

export default function GrowthPage() {
  const [activeTab, setActiveTab] = useState('records')
  const [selectedDogId, setSelectedDogId] = useState<string>('')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'records':
        return <GrowthRecords selectedDogId={selectedDogId} />
      case 'milestones':
        return <GrowthMilestones selectedDogId={selectedDogId} />
      case 'photos':
        return <GrowthPhotos selectedDogId={selectedDogId} />
      case 'logs':
        return <GrowthLogs selectedDogId={selectedDogId} />
      case 'charts':
        return <GrowthCharts selectedDogId={selectedDogId} />
      default:
        return <GrowthRecords selectedDogId={selectedDogId} />
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            成长档案
          </h1>
          <p className="text-gray-600">
            记录狗狗的成长轨迹、重要时刻和成长数据
          </p>
        </div>
        
        {/* 成长统计卡片 */}
        <GrowthStats selectedDogId={selectedDogId} onDogSelect={setSelectedDogId} />
        
        {/* 标签页导航 */}
        <div className="mt-8">
          <GrowthTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* 标签页内容 */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  )
} 