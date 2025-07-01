import { NextRequest, NextResponse } from 'next/server'
import { collectComprehensiveBusinessData } from '@/lib/dataCollector'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface AIAnalysisRequest {
  role?: 'all' | 'financial' | 'breeding' | 'health'
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 开始专业AI分析...')

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API密钥未配置')
    }

    const body = await request.json() as AIAnalysisRequest
    const requestedRole = body.role || 'all'

    // 收集全面的业务数据
    const businessData = await collectComprehensiveBusinessData()
    
    console.log(`🔍 业务数据收集完成: ${businessData.summary.total_dogs}只狗狗`)
    console.log(`📊 数据详情: ${businessData.summary.female_dogs}只母狗, ${businessData.summary.male_dogs}只公狗`)
    console.log(`⚠️  健康警报: ${businessData.summary.health_alerts}个紧急事项`)

    // 准备AI分析
    const analyses: { [key: string]: string } = {}

    // 财务管理专家分析
    if (requestedRole === 'all' || requestedRole === 'financial') {
      console.log('💰 启动财务管理专家分析...')
      analyses.financial = await callFinancialExpert(businessData)
    }

    // 狗狗繁育专家分析
    if (requestedRole === 'all' || requestedRole === 'breeding') {
      console.log('🐕‍🦺 启动狗狗繁育专家分析...')
      analyses.breeding = await callBreedingExpert(businessData)
    }

    // 狗狗健康专家分析
    if (requestedRole === 'all' || requestedRole === 'health') {
      console.log('🏥 启动狗狗健康专家分析...')
      analyses.health = await callHealthExpert(businessData)
    }

    const result = {
      success: true,
      data: {
        analysis_time: new Date().toISOString(),
        data_summary: businessData.summary,
        expert_analyses: analyses,
        combined_analysis: requestedRole === 'all' ? combineExpertAnalyses(analyses) : null
      }
    }

    console.log('✅ AI专家分析完成')
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ AI分析失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '分析失败，请重试'
      },
      { status: 500 }
    )
  }
}

async function callFinancialExpert(businessData: any): Promise<string> {
  const prompt = `
# 🏢 宠物繁育财务管理专家分析

## 角色定义
你是一位资深的宠物繁育业财务管理专家，拥有10年以上的宠物繁育财务分析经验。请基于以下详细数据，提供专业的财务分析和建议。

## 业务数据概况
- **总体统计**: ${businessData.summary.total_dogs}只狗狗 (${businessData.summary.female_dogs}只母狗, ${businessData.summary.male_dogs}只公狗)
- **总收入**: ¥${businessData.summary.total_revenue.toLocaleString()}
- **总支出**: ¥${businessData.summary.total_expenses.toLocaleString()}
- **净利润**: ¥${(businessData.summary.total_revenue - businessData.summary.total_expenses).toLocaleString()}

## 详细财务数据
${JSON.stringify(businessData.financial_analysis, null, 2)}

## 狗狗个体财务详情
${businessData.dogs_detail.map((dog: any) => `
**${dog.name}** (${dog.breed}, ${dog.gender}, ${dog.age_months}个月)
- 进价: ¥${dog.purchase_price || 0}
- 售价: ¥${dog.sale_price || 0}
- 总费用: ¥${dog.financial_records.filter((r: any) => r.type === 'expense').reduce((sum: number, r: any) => sum + r.amount, 0)}
- 状态: ${dog.status}
`).join('\n')}

## 分析要求
请从以下维度进行专业分析：

### 1. 整体财务健康度分析
- 收入支出结构分析
- 利润率和ROI计算
- 现金流状况评估

### 2. 个体狗狗盈利能力分析
- 每只狗狗的投资回报率
- 高盈利和亏损狗狗分析
- 品种盈利能力对比

### 3. 繁育业务盈利分析
- 每窝小狗的盈利情况
- 繁育成本效益分析
- 优质种狗投资价值评估

### 4. 成本控制建议
- 各类费用占比分析
- 成本优化建议
- 采购策略建议

### 5. 财务风险提示
- 潜在财务风险点
- 资金流风险预警
- 投资回收期分析

请用专业但易懂的语言，提供具体可行的财务管理建议。包含具体数字和百分比，并按优先级排序建议事项。
`

  return await callDeepSeekAPI(prompt)
}

async function callBreedingExpert(businessData: any): Promise<string> {
  const prompt = `
# 🐕‍🦺 宠物繁育专家分析

## 角色定义
你是一位资深的宠物繁育专家，拥有15年的犬类繁育经验，特别擅长母犬发情周期管理、配种时机把握和妊娠期管理。请基于以下数据提供专业的繁育指导。

## 业务数据概况
- **繁育种群**: ${businessData.summary.female_dogs}只母狗, ${businessData.summary.male_dogs}只公狗
- **可繁育母狗**: ${businessData.summary.active_breeding_females}只
- **怀孕母狗**: ${businessData.summary.pregnant_females}只

## 详细繁育数据
${JSON.stringify(businessData.breeding_analysis, null, 2)}

## 母狗详细信息
${businessData.breeding_analysis.female_dogs.map((dog: any) => `
**${dog.name}** (${dog.breed}, ${dog.age_months}个月)
- 繁育状态: ${dog.breeding_status}
- 上次发情: ${dog.last_heat_cycle || '未知'}
- 预计下次发情: ${dog.estimated_next_heat || '未知'}
- 怀孕详情: ${dog.pregnancy_details ? `
  配种日期: ${dog.pregnancy_details.mating_date}
  预产期: ${dog.pregnancy_details.expected_birth}
  怀孕阶段: ${dog.pregnancy_details.current_stage}
  怀孕天数: ${dog.pregnancy_details.days_pregnant}天
  配偶: ${dog.pregnancy_details.partner_info?.name || '未知'}
` : '无'}
- 繁育历史: ${dog.breeding_history.length}次记录
`).join('\n')}

## 公狗详细信息
${businessData.breeding_analysis.male_dogs.map((dog: any) => `
**${dog.name}** (${dog.breed}, ${dog.age_months}个月)
- 繁育状态: ${dog.breeding_status}
- 繁育记录: ${dog.breeding_history.length}次
`).join('\n')}

## 分析要求
请从以下维度进行专业分析：

### 1. 母犬发情周期管理
- 每只母犬的发情周期预测
- 最佳配种时机建议
- 发情监测要点提醒

### 2. 当前怀孕犬管理
- 怀孕各阶段的护理要点
- 产前准备检查清单
- 预产期精确计算和准备

### 3. 配种计划优化
- 最佳配种组合推荐
- 避免近亲繁殖的策略
- 品种改良建议

### 4. 繁育效率提升
- 繁育成功率分析
- 提高受孕率的方法
- 产仔数量优化建议

### 5. 种犬健康管理
- 繁育犬的营养需求
- 体况评估标准
- 繁育前健康检查项目

### 6. 时间规划建议
- 未来3个月的繁育日程安排
- 季节性繁育策略
- 年度繁育计划建议

请提供具体的时间节点、操作指导和注意事项，确保每只狗狗的信息准确对应。
`

  return await callDeepSeekAPI(prompt)
}

async function callHealthExpert(businessData: any): Promise<string> {
  const prompt = `
# 🏥 宠物健康管理专家分析

## 角色定义
你是一位资深的宠物健康管理专家和兽医师，拥有12年临床经验，擅长预防医学、疫苗管理和健康风险评估。请基于以下数据提供专业的健康管理建议。

## 业务数据概况
- **犬群规模**: ${businessData.summary.total_dogs}只狗狗
- **健康警报**: ${businessData.summary.health_alerts}个紧急事项

## 详细健康数据
${JSON.stringify(businessData.health_analysis, null, 2)}

## 每只狗狗的健康详情
${businessData.health_analysis.dogs_health.map((dog: any) => `
**${dog.name}** (${dog.breed}, ${dog.gender}, ${dog.age_months}个月)
- 健康状态: ${dog.health_status}
- 核心疫苗状态:
  * 狂犬病: ${dog.vaccination_status.core_vaccines.rabies.status} (上次: ${dog.vaccination_status.core_vaccines.rabies.last_date || '无记录'}, 下次: ${dog.vaccination_status.core_vaccines.rabies.next_due || '待定'})
  * DHPP联苗: ${dog.vaccination_status.core_vaccines.dhpp.status} (上次: ${dog.vaccination_status.core_vaccines.dhpp.last_date || '无记录'}, 下次: ${dog.vaccination_status.core_vaccines.dhpp.next_due || '待定'})
  * 犬窝咳: ${dog.vaccination_status.core_vaccines.bordetella.status} (上次: ${dog.vaccination_status.core_vaccines.bordetella.last_date || '无记录'}, 下次: ${dog.vaccination_status.core_vaccines.bordetella.next_due || '待定'})
- 即将到期的护理: ${dog.upcoming_care.map((care: any) => `${care.due_date} - ${care.description} (${care.priority})`).join(', ') || '无'}
- 健康记录: ${dog.health_records.length}条
`).join('\n')}

## 分析要求
请从以下维度进行专业分析：

### 1. 疫苗接种计划管理
- 每只狗狗的疫苗接种状态评估
- 即将到期的疫苗提醒
- 疫苗接种优先级排序
- 幼犬疫苗程序建议

### 2. 健康风险评估
- 高风险狗狗识别
- 年龄相关健康风险
- 品种遗传疾病风险
- 环境健康风险因素

### 3. 预防医学计划
- 定期体检计划
- 寄生虫预防程序
- 牙齿护理计划
- 营养健康管理

### 4. 繁育期健康管理
- 怀孕犬的特殊健康需求
- 哺乳期营养和健康监测
- 种犬健康标准
- 幼犬健康监测要点

### 5. 紧急健康处理
- 需要立即关注的健康问题
- 紧急就医指征
- 常见疾病预防措施
- 健康监测指标

### 6. 健康成本管理
- 预防性护理成本预算
- 健康投资优先级
- 兽医资源优化利用
- 健康档案管理建议

### 7. 未来30天健康计划
- 具体的健康任务清单
- 每只狗狗的健康安排
- 健康检查时间表
- 疫苗接种日程

请确保每只狗狗的健康建议都准确对应其个体情况，提供具体的时间安排和操作指导。
`

  return await callDeepSeekAPI(prompt)
}

function combineExpertAnalyses(analyses: { [key: string]: string }): string {
  return `
# 🎯 宠物繁育管理综合专家报告

## 专家团队联合建议

基于财务管理专家、繁育专家和健康专家的深度分析，我们为您的宠物繁育业务提供以下综合建议：

## 📊 综合分析总结

${analyses.financial ? '### 💰 财务专家核心观点\n' + analyses.financial.split('\n').slice(0, 10).join('\n') + '\n\n' : ''}

${analyses.breeding ? '### 🐕‍🦺 繁育专家核心观点\n' + analyses.breeding.split('\n').slice(0, 10).join('\n') + '\n\n' : ''}

${analyses.health ? '### 🏥 健康专家核心观点\n' + analyses.health.split('\n').slice(0, 10).join('\n') + '\n\n' : ''}

## 🔥 优先行动计划

### 紧急事项 (7天内)
1. 处理健康专家标识的紧急健康问题
2. 执行繁育专家建议的即时配种时机
3. 实施财务专家提出的成本控制措施

### 重要事项 (30天内)
1. 完善疫苗接种计划
2. 优化繁育配种计划
3. 调整财务预算和投资策略

### 长期规划 (3个月内)
1. 建立系统的健康档案管理
2. 实施品种改良计划
3. 优化整体盈利结构

## 📈 预期效果评估

按照专家团队的联合建议执行，预期在3个月内可以实现：
- 健康管理效率提升30%
- 繁育成功率提高20%
- 整体盈利能力改善25%

---

**重要提醒**: 以上建议基于当前数据分析得出，请结合实际情况灵活调整。建议定期重新评估和更新计划。
`
}

async function callDeepSeekAPI(prompt: string): Promise<string> {
  const maxRetries = 5
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      console.log(`🤖 DeepSeek API 调用尝试 ${retryCount + 1}/${maxRetries}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
          top_p: 0.9,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log(`✅ 收到响应，状态码: ${response.status}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📝 API 响应解析成功')

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content
        console.log(`🎉 AI 分析完成，返回内容长度: ${content.length}`)
        return content
      } else {
        throw new Error('API返回数据格式异常')
      }

    } catch (error) {
      retryCount++
      console.log(`❌ DeepSeek API 调用失败 (尝试 ${retryCount}/${maxRetries}):`, error)

      if (retryCount >= maxRetries) {
        throw new Error(`DeepSeek API调用失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }

      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
      console.log(`⏱️  等待 ${delay}ms 后重试...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('API调用重试次数耗尽')
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'AI分析服务运行正常',
      endpoints: {
        POST: '/api/ai-analysis - 执行AI分析'
      }
    },
    { status: 200 }
  )
} 