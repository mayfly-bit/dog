import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Supabase URL 和密钥（从环境变量获取）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 创建 Supabase 客户端实例
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// 工具函数：处理 Supabase 错误
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error.code === 'PGRST116') {
    return '没有找到相关数据'
  } else if (error.code === 'PGRST301') {
    return '权限不足，请检查您的登录状态'
  } else if (error.message?.includes('JWT')) {
    return '登录已过期，请重新登录'
  } else if (error.message?.includes('timeout')) {
    return '请求超时，请检查网络连接'
  }
  
  return error.message || '操作失败，请重试'
}

// 工具函数：批量操作
export const batchInsert = async (table: string, data: any[], batchSize = 100) => {
  const results = []
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const { data: result, error } = await supabase
      .from(table)
      .insert(batch)
      .select()
    
    if (error) {
      throw error
    }
    
    if (result) {
      results.push(...result)
    }
  }
  
  return results
} 