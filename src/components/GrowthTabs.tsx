'use client'

interface GrowthTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function GrowthTabs({ activeTab, onTabChange }: GrowthTabsProps) {
  const tabs = [
    { id: 'records', label: '成长记录', icon: '📏', description: '体重身高等成长数据' },
    { id: 'milestones', label: '里程碑', icon: '🎯', description: '重要成长时刻' },
    { id: 'photos', label: '成长照片', icon: '📷', description: '照片时间轴' },
    { id: 'logs', label: '成长日志', icon: '📝', description: '日常成长记录' },
    { id: 'charts', label: '成长曲线', icon: '📈', description: '成长数据图表' }
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