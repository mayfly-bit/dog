'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Heart, 
  Dog, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  Brain,
  Stethoscope,
  Calculator,
  Archive,
  Trash2,
  Download,
  FileText
} from 'lucide-react'

interface AIAnalysisData {
  id: string
  analysis_time: string
  expert_role: string
  data_summary: {
    total_dogs: number
    female_dogs: number
    male_dogs: number
    active_breeding_females: number
    pregnant_females: number
    total_revenue: number
    total_expenses: number
    health_alerts: number
  }
  expert_analyses: {
    financial?: string
    breeding?: string
    health?: string
  }
  combined_analysis?: string
}

interface StoredReport {
  id: string
  title: string
  timestamp: string
  data: AIAnalysisData
}

type ExpertRole = 'all' | 'financial' | 'breeding' | 'health'

const expertRoles = [
  {
    id: 'all' as ExpertRole,
    name: '综合专家团队',
    icon: Users,
    color: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600',
    description: '财务、繁育、健康三位专家联合分析',
    badge: '全面'
  },
  {
    id: 'financial' as ExpertRole,
    name: '财务管理专家',
    icon: Calculator,
    color: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600',
    description: '专业分析狗狗进价、售价、利润率、成本控制',
    badge: '财务'
  },
  {
    id: 'breeding' as ExpertRole,
    name: '狗狗繁育专家',
    icon: Heart,
    color: 'bg-gradient-to-br from-rose-500 via-pink-600 to-red-600',
    description: '母狗发情周期、配种时机、妊娠期管理专业建议',
    badge: '繁育'
  },
  {
    id: 'health' as ExpertRole,
    name: '狗狗健康专家',
    icon: Stethoscope,
    color: 'bg-gradient-to-br from-blue-500 via-cyan-600 to-sky-600',
    description: '疫苗管理、健康评估、预防医学专业指导',
    badge: '健康'
  }
]

// 清理文本格式，移除markdown符号
const cleanText = (text: string): string => {
  if (!text) return ''
  
  return text
    // 移除所有markdown符号
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // 移除加粗 **text**
    .replace(/\*([^*]+)\*/g, '$1')      // 移除斜体 *text*
    .replace(/#+\s*/g, '')              // 移除标题符号 ### 
    .replace(/`([^`]+)`/g, '$1')        // 移除行内代码 `code`
    .replace(/```[\s\S]*?```/g, '')     // 移除代码块
    .replace(/>\s*/g, '')               // 移除引用符号 >
    .replace(/[-*+]\s+/g, '• ')         // 将列表符号转换为圆点
    .replace(/\n\s*\n\s*\n/g, '\n\n')   // 清理多余空行
    .replace(/^\s+|\s+$/g, '')          // 清理首尾空白
    .trim()
}

// 格式化文本显示
const formatText = (text: string): JSX.Element[] => {
  const cleanedText = cleanText(text)
  const paragraphs = cleanedText.split('\n\n').filter(p => p.trim())
  
  return paragraphs.map((paragraph, index) => {
    const lines = paragraph.split('\n').filter(line => line.trim())
    
    return (
      <div key={index} className="mb-4 last:mb-0">
        {lines.map((line, lineIndex) => {
          const trimmedLine = line.trim()
          
          // 检查是否是列表项
          if (trimmedLine.startsWith('• ')) {
            return (
              <div key={lineIndex} className="flex items-start mb-2">
                <span className="text-blue-500 mr-2 mt-1 flex-shrink-0">•</span>
                <span className="text-gray-700 leading-relaxed">{trimmedLine.slice(2)}</span>
              </div>
            )
          }
          
          // 检查是否是标题（全大写或包含冒号）
          if (trimmedLine.endsWith('：') || trimmedLine.endsWith(':') || /^[A-Z\s]+$/.test(trimmedLine)) {
            return (
              <h4 key={lineIndex} className="font-semibold text-gray-900 mb-2 text-lg">
                {trimmedLine}
              </h4>
            )
          }
          
          // 普通段落
          return (
            <p key={lineIndex} className="text-gray-700 leading-relaxed mb-2">
              {trimmedLine}
            </p>
          )
        })}
      </div>
    )
  })
}

export default function AIAnalysis() {
  const [selectedRole, setSelectedRole] = useState<ExpertRole>('all')
  const [analysisData, setAnalysisData] = useState<AIAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [storedReports, setStoredReports] = useState<StoredReport[]>([])
  const [showReports, setShowReports] = useState(false)

  // 加载存储的报告
  useEffect(() => {
    const saved = localStorage.getItem('ai-analysis-reports')
    if (saved) {
      try {
        setStoredReports(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse stored reports:', e)
      }
    }
  }, [])

  // 保存报告到本地存储
  const saveReport = (data: AIAnalysisData) => {
    const newReport: StoredReport = {
      id: Date.now().toString(),
      title: `${expertRoles.find(e => e.id === selectedRole)?.name}分析报告`,
      timestamp: new Date().toISOString(),
      data: { ...data, id: Date.now().toString(), expert_role: selectedRole }
    }

    const updatedReports = [newReport, ...storedReports].slice(0, 3) // 只保留最新3条
    setStoredReports(updatedReports)
    localStorage.setItem('ai-analysis-reports', JSON.stringify(updatedReports))
  }

  // 删除报告
  const deleteReport = (id: string) => {
    const updatedReports = storedReports.filter(report => report.id !== id)
    setStoredReports(updatedReports)
    localStorage.setItem('ai-analysis-reports', JSON.stringify(updatedReports))
  }

  // 查看历史报告
  const viewReport = (report: StoredReport) => {
    setAnalysisData(report.data)
    setSelectedRole(report.data.expert_role as ExpertRole)
    setShowReports(false)
  }

  const analyzeData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expert: selectedRole })
      })

      const data = await response.json()
      
      if (data.success) {
        const analysisResult = {
          ...data.data,
          id: Date.now().toString(),
          expert_role: selectedRole
        }
        setAnalysisData(analysisResult)
        saveReport(analysisResult)
      } else {
        setError(data.error || '分析失败')
      }
    } catch (err) {
      setError('网络请求失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const renderAnalysisContent = () => {
    if (!analysisData) return null

    return (
      <div className="space-y-8">
        {/* 数据概况卡片 */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-3 h-7 w-7 text-blue-600" />
              业务数据概况
            </h3>
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {new Date(analysisData.analysis_time).toLocaleString('zh-CN')}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Dog className="mx-auto h-12 w-12 text-blue-500 mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{analysisData.data_summary.total_dogs}</div>
              <div className="text-sm font-medium text-gray-600">总狗数</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <Heart className="mx-auto h-12 w-12 text-pink-500 mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{analysisData.data_summary.female_dogs}</div>
              <div className="text-sm font-medium text-gray-600">母狗数量</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <DollarSign className="mx-auto h-12 w-12 text-green-500 mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">¥{analysisData.data_summary.total_revenue.toLocaleString()}</div>
              <div className="text-sm font-medium text-gray-600">总收入</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{analysisData.data_summary.health_alerts}</div>
              <div className="text-sm font-medium text-gray-600">健康警报</div>
            </div>
          </div>
        </div>

        {/* 综合分析 */}
        {selectedRole === 'all' && analysisData.combined_analysis && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border border-purple-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="mr-3 h-7 w-7 text-purple-600" />
              综合专家团队分析
            </h3>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="prose max-w-none">
                {formatText(analysisData.combined_analysis)}
              </div>
            </div>
          </div>
        )}

        {/* 财务专家分析 */}
        {(selectedRole === 'all' || selectedRole === 'financial') && analysisData.expert_analyses.financial && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-lg border border-emerald-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Calculator className="mr-3 h-7 w-7 text-emerald-600" />
              财务管理专家分析
            </h3>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="prose max-w-none">
                {formatText(analysisData.expert_analyses.financial)}
              </div>
            </div>
          </div>
        )}

        {/* 繁育专家分析 */}
        {(selectedRole === 'all' || selectedRole === 'breeding') && analysisData.expert_analyses.breeding && (
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl shadow-lg border border-rose-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Heart className="mr-3 h-7 w-7 text-rose-600" />
              狗狗繁育专家分析
            </h3>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="prose max-w-none">
                {formatText(analysisData.expert_analyses.breeding)}
              </div>
            </div>
          </div>
        )}

        {/* 健康专家分析 */}
        {(selectedRole === 'all' || selectedRole === 'health') && analysisData.expert_analyses.health && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-100 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Stethoscope className="mr-3 h-7 w-7 text-blue-600" />
              狗狗健康专家分析
            </h3>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="prose max-w-none">
                {formatText(analysisData.expert_analyses.health)}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Brain className="mr-3 h-8 w-8 text-purple-600" />
          AI智能分析
        </h1>
        <button
          onClick={() => setShowReports(!showReports)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Archive className="h-5 w-5" />
          <span>历史报告 ({storedReports.length})</span>
        </button>
      </div>

      {/* 历史报告列表 */}
      {showReports && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-semibold mb-4">历史分析报告</h3>
          {storedReports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">暂无历史报告</p>
          ) : (
            <div className="space-y-3">
              {storedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium">{report.title}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(report.timestamp).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewReport(report)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      查看
                    </button>
                    <button
                      onClick={() => deleteReport(report.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 专家角色选择 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">选择AI专家角色</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {expertRoles.map((expert) => {
            const IconComponent = expert.icon
            return (
              <button
                key={expert.id}
                onClick={() => setSelectedRole(expert.id)}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl
                  ${selectedRole === expert.id 
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                <div className={`w-16 h-16 rounded-xl ${expert.color} flex items-center justify-center mb-4 mx-auto shadow-lg`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${expert.color} text-white`}>
                  {expert.badge}
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg">{expert.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{expert.description}</p>
                {selectedRole === expert.id && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 分析按钮 */}
      <div className="flex justify-center">
        <button
          onClick={analyzeData}
          disabled={loading}
          className={`
            px-12 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 shadow-lg
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 hover:shadow-2xl hover:scale-105'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              {selectedRole === 'all' ? '专家团队分析中...' : '专家分析中...'}
            </div>
          ) : (
            `开始${expertRoles.find(e => e.id === selectedRole)?.name}分析`
          )}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <span className="text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* 分析结果 */}
      {renderAnalysisContent()}
    </div>
  )
}
