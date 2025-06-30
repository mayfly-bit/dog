'use client'

import { useState } from 'react'
import { BusinessAnalyticsData } from '@/lib/dataCollector'

export default function AIAnalysis() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null)
  const [businessData, setBusinessData] = useState<BusinessAnalyticsData | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log('正在进行AI分析...')
      
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `分析请求失败: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        setBusinessData(result.data.businessData)
        setAnalysis(result.data.analysis)
        setLastAnalysisTime(new Date())
      } else {
        throw new Error('分析结果格式错误')
      }
      
    } catch (err) {
      console.error('AI分析失败:', err)
      setError(err instanceof Error ? err.message : '分析过程中发生未知错误')
    } finally {
      setLoading(false)
    }
  }

  const formatAnalysisText = (text: string) => {
    // 将分析文本格式化为更易读的格式
    return text.split('\n').map((line, index) => {
      line = line.trim()
      if (!line) return <br key={index} />
      
      // 检测标题
      if (line.match(/^[一二三四五六七八九十\d]+[、\.。]/)) {
        return (
          <h3 key={index} className="text-lg font-semibold text-gray-800 mt-6 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {line}
          </h3>
        )
      }
      
      // 检测子标题
      if (line.match(/^[\(\（][一二三四五六七八九十\d]+[\)\）]/)) {
        return (
          <h4 key={index} className="text-md font-medium text-gray-700 mt-4 mb-2 ml-4">
            {line}
          </h4>
        )
      }
      
      // 检测要点
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={index} className="flex items-start ml-6 mb-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
            <span className="text-gray-700">{line.substring(2)}</span>
          </div>
        )
      }
      
      // 普通段落
      return (
        <p key={index} className="text-gray-700 mb-3 leading-relaxed">
          {line}
        </p>
      )
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* 标题区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🤖 AI 智能分析</h1>
            <p className="text-blue-100">基于DeepSeek AI的专业宠物繁育业务分析</p>
          </div>
          <div className="text-right">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>开始分析</span>
                </>
              )}
            </button>
            {lastAnalysisTime && (
              <p className="text-blue-100 text-sm mt-2">
                上次分析: {lastAnalysisTime.toLocaleString('zh-CN')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 数据概览 */}
      {businessData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            📊 数据概览
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{businessData.overview.totalDogs}</div>
              <div className="text-sm text-gray-600">总犬只数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">¥{businessData.financial.netProfit.toFixed(0)}</div>
              <div className="text-sm text-gray-600">净利润</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{businessData.health.totalHealthRecords}</div>
              <div className="text-sm text-gray-600">健康记录</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{businessData.breeding.totalLitters}</div>
              <div className="text-sm text-gray-600">繁殖记录</div>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-semibold">分析失败</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI分析结果 */}
      {analysis && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              🎯 AI 分析报告
            </h2>
            <p className="text-green-100 text-sm mt-1">
              由DeepSeek AI提供的专业业务分析建议
            </p>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              {formatAnalysisText(analysis)}
            </div>
          </div>
        </div>
      )}

      {/* 功能说明 */}
      {!analysis && !loading && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 AI分析功能说明</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">分析维度</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 财务状况分析（收入、支出、盈利能力）</li>
                <li>• 健康管理评估（疫苗覆盖率、疾病预防）</li>
                <li>• 繁殖业务分析（配种成功率、幼犬存活率）</li>
                <li>• 库存管理（在售数量、品种分布）</li>
                <li>• 运营效率建议（流程优化、风险控制）</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">AI优势</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 专业的宠物繁育管理知识</li>
                <li>• 数据驱动的客观分析</li>
                <li>• 具体可执行的改进建议</li>
                <li>• 优先级明确的行动计划</li>
                <li>• 24/7随时可用的智能顾问</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
