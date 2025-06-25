'use client'

interface BreedingTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BreedingTabs({ activeTab, onTabChange }: BreedingTabsProps) {
  const tabs = [
    { id: 'mating', label: '配种记录', icon: '💕', description: '管理配种记录和计划' },
    { id: 'pregnancy', label: '怀孕记录', icon: '🤱', description: '跟踪怀孕进度和护理' },
    { id: 'litter', label: '产仔记录', icon: '🐶', description: '记录分娩和幼犬信息' },
    { id: 'pedigree', label: '谱系管理', icon: '🌳', description: '查看和管理血统关系' }
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
                ? 'border-b-2 border-pink-500 text-pink-600'
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