'use client'

interface FinanceTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function FinanceTabs({ activeTab, onTabChange }: FinanceTabsProps) {
  const tabs = [
    { id: 'purchases', label: '进货记录', icon: '📦', description: '管理狗狗进货信息' },
    { id: 'sales', label: '销售记录', icon: '💰', description: '记录狗狗销售情况' },
    { id: 'expenses', label: '支出记录', icon: '💸', description: '追踪各种费用支出' },
    { id: 'reports', label: '财务报表', icon: '📊', description: '查看财务分析报告' }
  ]

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
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
  )
} 