'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import HealthStats from '@/components/HealthStats'
import HealthTabs from '@/components/HealthTabs'
import VaccinationRecords from '@/components/VaccinationRecords'
import CheckupRecords from '@/components/CheckupRecords'
import TreatmentRecords from '@/components/TreatmentRecords'
import HealthTimeline from '@/components/HealthTimeline'

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState('vaccination')
  const [selectedDogId, setSelectedDogId] = useState<string>('')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'vaccination':
        return <VaccinationRecords selectedDogId={selectedDogId} />
      case 'checkup':
        return <CheckupRecords selectedDogId={selectedDogId} />
      case 'treatment':
        return <TreatmentRecords selectedDogId={selectedDogId} />
      case 'timeline':
        return <HealthTimeline selectedDogId={selectedDogId} />
      default:
        return <VaccinationRecords selectedDogId={selectedDogId} />
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            健康管理
          </h1>
          <p className="text-gray-600">
            管理狗狗的疫苗接种、健康检查、医疗治疗记录
          </p>
        </div>
        
        {/* 健康统计卡片 */}
        <HealthStats selectedDogId={selectedDogId} onDogSelect={setSelectedDogId} />
        
        {/* 标签页导航 */}
        <div className="mt-8">
          <HealthTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* 标签页内容 */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  )
} 