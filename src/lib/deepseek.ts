interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface DeepSeekResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

class DeepSeekClient {
  private apiKey: string
  private baseURL: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseURL = 'https://api.deepseek.com/v1'
  }

  async chat(messages: DeepSeekMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          max_tokens: 4000,
          temperature: 0.7,
          stream: false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`)
      }

      const data: DeepSeekResponse = await response.json()
      return data.choices[0]?.message?.content || '抱歉，AI分析服务暂时无法响应。'
    } catch (error) {
      console.error('DeepSeek API 调用失败:', error)
      throw error
    }
  }

  async analyzeBusinessData(data: any): Promise<string> {
    const systemPrompt = `你是一位专业的宠物繁育管理顾问，精通财务分析、健康管理、繁殖管理和业务运营。
请基于提供的数据，从以下几个维度进行深入分析并给出专业建议：

1. 财务状况分析（收入、支出、盈利能力、成本控制）
2. 健康管理评估（疫苗覆盖率、疾病预防、治疗成本）
3. 繁殖业务分析（配种成功率、幼犬存活率、繁殖周期）
4. 库存管理（在售狗狗数量、品种分布、市场定位）
5. 运营效率建议（流程优化、风险控制、增长机会）

请用中文回答，结构清晰，每个建议都要具体可执行，并给出优先级。`

    const userPrompt = `请分析以下宠物繁育管理系统的业务数据：

${JSON.stringify(data, null, 2)}

请提供详细的分析报告和改进建议。`

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ])
  }
}

// 导出单例实例
export const deepseekClient = new DeepSeekClient(
  process.env.DEEPSEEK_API_KEY || ''
)

export { DeepSeekClient }
export type { DeepSeekMessage }
