import { NextRequest, NextResponse } from 'next/server'
import { DeepSeekClient } from '@/lib/deepseek'
import { dataCollector } from '@/lib/dataCollector'

// 确保API密钥安全
const deepseekClient = new DeepSeekClient(process.env.DEEPSEEK_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // 验证请求
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: '请求格式错误' },
        { status: 400 }
      )
    }

    // 收集业务数据
    console.log('开始收集业务数据...')
    const businessData = await dataCollector.collectAllData()
    
    // 调用AI分析
    console.log('开始AI分析...')
    const analysis = await deepseekClient.analyzeBusinessData(businessData)
    
    return NextResponse.json({
      success: true,
      data: {
        analysis,
        businessData,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('AI分析API错误:', error)
    
    // 根据错误类型返回不同的错误信息
    if (error instanceof Error) {
      if (error.message.includes('DeepSeek API')) {
        return NextResponse.json(
          { error: 'AI服务暂时不可用，请稍后重试' },
          { status: 503 }
        )
      }
      if (error.message.includes('数据收集')) {
        return NextResponse.json(
          { error: '数据收集失败，请检查数据库连接' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: '分析服务暂时不可用' },
      { status: 500 }
    )
  }
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