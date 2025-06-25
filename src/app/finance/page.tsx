'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import FinanceStats from '@/components/FinanceStats'
import FinanceTabs from '@/components/FinanceTabs'
import PurchaseRecords from '@/components/PurchaseRecords'
import SaleRecords from '@/components/SaleRecords'
import ExpenseRecords from '@/components/ExpenseRecords'
import FinanceReports from '@/components/FinanceReports'

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('purchases')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'purchases':
        return <PurchaseRecords />
      case 'sales':
        return <SaleRecords />
      case 'expenses':
        return <ExpenseRecords />
      case 'reports':
        return <FinanceReports />
      default:
        return <PurchaseRecords />
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            财务管理
          </h1>
          <p className="text-gray-600">
            管理进货、销售、支出记录，查看财务报表
          </p>
        </div>
        
        {/* 财务统计卡片 */}
        <FinanceStats />
        
        {/* 标签页导航 */}
        <div className="mt-8">
          <FinanceTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* 标签页内容 */}
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  )
} 