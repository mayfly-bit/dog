// 性能监控工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // 开始计时
  startTiming(label: string): void {
    this.metrics.set(`${label}_start`, performance.now())
  }

  // 结束计时并返回耗时
  endTiming(label: string): number {
    const startTime = this.metrics.get(`${label}_start`)
    if (!startTime) {
      console.warn(`未找到计时标签: ${label}`)
      return 0
    }

    const endTime = performance.now()
    const duration = endTime - startTime
    this.metrics.set(label, duration)

    // 在开发环境下输出性能信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  // 获取所有指标
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {}
    this.metrics.forEach((value, key) => {
      if (!key.endsWith('_start')) {
        result[key] = value
      }
    })
    return result
  }

  // 清空指标
  clearMetrics(): void {
    this.metrics.clear()
  }
}

// 性能装饰器
export function measurePerformance(label: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance()
      monitor.startTiming(label)
      
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } finally {
        monitor.endTiming(label)
      }
    }

    return descriptor
  }
}

// React Hook for performance monitoring
import { useEffect, useRef, useState } from 'react'

export function usePerformanceMonitor(label: string) {
  const startTimeRef = useRef<number>(0)
  const [duration, setDuration] = useState<number>(0)

  useEffect(() => {
    startTimeRef.current = performance.now()
    
    return () => {
      const endTime = performance.now()
      const elapsed = endTime - startTimeRef.current
      setDuration(elapsed)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Component ${label}: ${elapsed.toFixed(2)}ms`)
      }
    }
  }, [label])

  return duration
}

// 数据库查询缓存
export class QueryCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  static set(key: string, data: any, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000 // 转换为毫秒
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  static clear(): void {
    this.cache.clear()
  }

  static size(): number {
    return this.cache.size
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 懒加载组件工具
import React from 'react'

export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc)
  
  return function WrappedComponent(props: React.ComponentProps<T>) {
    return React.createElement(
      React.Suspense,
      { 
        fallback: fallback 
          ? React.createElement(fallback) 
          : React.createElement('div', {}, 'Loading...')
      },
      React.createElement(LazyComponent, props)
    )
  }
}

// 虚拟滚动Hook
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex,
    endIndex
  }
}

// 内存使用监控
export function getMemoryUsage(): string {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    const used = (memory.usedJSHeapSize / 1048576).toFixed(2)
    const total = (memory.totalJSHeapSize / 1048576).toFixed(2)
    const limit = (memory.jsHeapSizeLimit / 1048576).toFixed(2)
    
    return `内存使用: ${used}MB / ${total}MB (限制: ${limit}MB)`
  }
  
  return '内存信息不可用'
}

// 网络状态监控
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState<string>('未知')

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const updateConnectionType = () => {
      const connection = (navigator as any).connection
      if (connection) {
        setConnectionType(connection.effectiveType || '未知')
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    updateOnlineStatus()
    updateConnectionType()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return { isOnline, connectionType }
} 