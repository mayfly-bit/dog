'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import BreedingStats from '@/components/BreedingStats'
import BreedingTabs from '@/components/BreedingTabs'
import MatingRecords from '@/components/MatingRecords'
import PregnancyRecords from '@/components/PregnancyRecords'
import LitterRecords from '@/components/LitterRecords'
import PedigreeView from '@/components/PedigreeView'

export default function BreedingPage() {
  const [activeTab, setActiveTab] = useState('mating')
  const [selectedDogId, setSelectedDogId] = useState<string>('')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mating':
        return <MatingRecords selectedDogId={selectedDogId} />
      case 'pregnancy':
        return <PregnancyRecords selectedDogId={selectedDogId} />
      case 'litter':
        return <LitterRecords selectedDogId={selectedDogId} />
      case 'pedigree':
        return <PedigreeView selectedDogId={selectedDogId} />
      default:
        return <MatingRecords selectedDogId={selectedDogId} />
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            繁殖管理
          </h1>
          <p className="text-gray-600">
            管理配种记录、怀孕追踪、产仔记录和谱系关系
          </p>
        </div>
        
        {/* 繁殖统计卡片 */}
        <BreedingStats selectedDogId={selectedDogId} onDogSelect={setSelectedDogId} />
        
        {/* 标签页导航 */}
        <div className="mt-8">
          <BreedingTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* 标签页内容 */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  )
} 