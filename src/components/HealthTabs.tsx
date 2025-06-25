'use client'

interface HealthTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function HealthTabs({ activeTab, onTabChange }: HealthTabsProps) {
  const tabs = [
    { id: 'vaccination', label: '疫苗接种', icon: '💉', description: '管理疫苗接种记录' },
    { id: 'checkup', label: '健康检查', icon: '🏥', description: '记录定期健康检查' },
    { id: 'treatment', label: '治疗记录', icon: '💊', description: '记录医疗治疗情况' },
    { id: 'timeline', label: '健康时间轴', icon: '📊', description: '查看健康历史时间线' }
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
                ? 'border-b-2 border-green-500 text-green-600'
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