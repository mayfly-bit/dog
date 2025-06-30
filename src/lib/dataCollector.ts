import { supabase } from './supabase'

export interface BusinessAnalyticsData {
  // 基础统计
  overview: {
    totalDogs: number
    activeDogs: number
    soldDogs: number
    forSaleDogs: number
    averageAge: number
    breedDistribution: Record<string, number>
  }
  
  // 财务数据
  financial: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    averageSalePrice: number
    averagePurchasePrice: number
    monthlyTrends: Array<{
      month: string
      revenue: number
      expenses: number
      profit: number
    }>
    expenseCategories: Record<string, number>
  }
  
  // 健康管理
  health: {
    totalHealthRecords: number
    vaccinationCoverage: number
    treatmentCosts: number
    commonHealthIssues: Record<string, number>
    averageHealthCostPerDog: number
    recentHealthTrends: Array<{
      month: string
      treatments: number
      vaccinations: number
      checkups: number
    }>
  }
  
  // 繁殖管理
  breeding: {
    totalLitters: number
    activePregnancies: number
    completedBirths: number
    averageLitterSize: number
    breedingSuccessRate: number
    monthlyBirths: Array<{
      month: string
      births: number
      pregnancies: number
    }>
  }
  
  // 业务指标
  performance: {
    salesConversionRate: number
    averageTimeToSale: number
    customerRetention: number
    seasonalTrends: Record<string, number>
    popularBreeds: Array<{
      breed: string
      count: number
      averagePrice: number
    }>
  }
  
  // 数据收集时间
  collectedAt: Date
}

export class DataCollector {
  
  async collectAllData(): Promise<BusinessAnalyticsData> {
    try {
      const [
        overview,
        financial,
        health,
        breeding,
        performance
      ] = await Promise.all([
        this.collectOverviewData(),
        this.collectFinancialData(),
        this.collectHealthData(),
        this.collectBreedingData(),
        this.collectPerformanceData()
      ])

      return {
        overview,
        financial,
        health,
        breeding,
        performance,
        collectedAt: new Date()
      }
    } catch (error) {
      console.error('数据收集失败:', error)
      throw new Error('无法收集业务数据进行分析')
    }
  }

  private async collectOverviewData() {
    const { data: dogs } = await supabase
      .from('dogs')
      .select('id, breed, birth_date, status, gender')

    if (!dogs) return this.getEmptyOverview()

    const now = new Date()
    const totalDogs = dogs.length
    const activeDogs = dogs.filter(d => ['owned', 'for_sale'].includes(d.status || '')).length
    const soldDogs = dogs.filter(d => d.status === 'sold').length
    const forSaleDogs = dogs.filter(d => d.status === 'for_sale').length
    
    const averageAge = dogs.reduce((sum, dog) => {
      const age = (now.getTime() - new Date(dog.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365)
      return sum + age
    }, 0) / dogs.length || 0

    const breedDistribution = dogs.reduce((acc, dog) => {
      acc[dog.breed] = (acc[dog.breed] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalDogs,
      activeDogs,
      soldDogs,
      forSaleDogs,
      averageAge: Number(averageAge.toFixed(1)),
      breedDistribution
    }
  }

  private async collectFinancialData() {
    const [salesResult, purchasesResult, expensesResult] = await Promise.all([
      supabase.from('sales').select('amount, sale_date'),
      supabase.from('purchases').select('amount, purchase_date'),
      supabase.from('expenses').select('amount, expense_date, category')
    ])

    const sales = salesResult.data || []
    const purchases = purchasesResult.data || []
    const expenses = expensesResult.data || []

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0)
    const totalPurchaseCosts = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)
    const totalOperatingExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalExpenses = totalPurchaseCosts + totalOperatingExpenses
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    const averageSalePrice = sales.length > 0 ? totalRevenue / sales.length : 0
    const averagePurchasePrice = purchases.length > 0 ? totalPurchaseCosts / purchases.length : 0

    // 月度趋势
    const monthlyTrends = this.calculateMonthlyTrends(sales, purchases, expenses)
    
    // 支出分类
    const expenseCategories = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: Number(profitMargin.toFixed(2)),
      averageSalePrice: Number(averageSalePrice.toFixed(2)),
      averagePurchasePrice: Number(averagePurchasePrice.toFixed(2)),
      monthlyTrends,
      expenseCategories
    }
  }

  private async collectHealthData() {
    const { data: healthRecords } = await supabase
      .from('health_records')
      .select('id, type, date, description, cost')

    if (!healthRecords) return this.getEmptyHealthData()

    const totalHealthRecords = healthRecords.length
    const vaccinations = healthRecords.filter(r => r.type === 'vaccination').length
    const { data: totalDogs } = await supabase.from('dogs').select('id')
    const vaccinationCoverage = totalDogs ? (vaccinations / totalDogs.length) * 100 : 0
    
    const treatmentCosts = healthRecords
      .filter(r => r.type === 'treatment')
      .reduce((sum, r) => sum + (r.cost || 0), 0)

    const averageHealthCostPerDog = totalDogs ? treatmentCosts / totalDogs.length : 0

    // 常见健康问题
    const commonHealthIssues = healthRecords.reduce((acc, record) => {
      if (record.type === 'treatment' && record.description) {
        const issue = this.categorizeHealthIssue(record.description)
        acc[issue] = (acc[issue] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const recentHealthTrends = this.calculateHealthTrends(healthRecords)

    return {
      totalHealthRecords,
      vaccinationCoverage: Number(vaccinationCoverage.toFixed(1)),
      treatmentCosts,
      commonHealthIssues,
      averageHealthCostPerDog: Number(averageHealthCostPerDog.toFixed(2)),
      recentHealthTrends
    }
  }

  private async collectBreedingData() {
    const { data: litters } = await supabase
      .from('litters')
      .select('id, mating_date, expected_birth_date, birth_date, puppy_count')

    if (!litters) return this.getEmptyBreedingData()

    const totalLitters = litters.length
    const activePregnancies = litters.filter(l => !l.birth_date && new Date(l.expected_birth_date) > new Date()).length
    const completedBirths = litters.filter(l => l.birth_date).length
    
    const averageLitterSize = litters
      .filter(l => l.puppy_count && l.puppy_count > 0)
      .reduce((sum, l) => sum + (l.puppy_count || 0), 0) / completedBirths || 0

    const breedingSuccessRate = totalLitters > 0 ? (completedBirths / totalLitters) * 100 : 0

    const monthlyBirths = this.calculateBreedingTrends(litters)

    return {
      totalLitters,
      activePregnancies,
      completedBirths,
      averageLitterSize: Number(averageLitterSize.toFixed(1)),
      breedingSuccessRate: Number(breedingSuccessRate.toFixed(1)),
      monthlyBirths
    }
  }

  private async collectPerformanceData() {
    const [salesResult, dogsResult] = await Promise.all([
      supabase.from('sales').select('sale_date, dog_id'),
      supabase.from('dogs').select('id, breed, status, created_at')
    ])

    const sales = salesResult.data || []
    const dogs = dogsResult.data || []

    const totalForSale = dogs.filter(d => d.status === 'for_sale').length
    const totalSold = sales.length
    const salesConversionRate = totalForSale + totalSold > 0 ? (totalSold / (totalForSale + totalSold)) * 100 : 0

    // 计算平均销售时间
    const averageTimeToSale = this.calculateAverageTimeToSale(sales, dogs)

    // 品种受欢迎程度
    const popularBreeds = this.calculateBreedPopularity(dogs, sales)

    // 季节性趋势 (简化版)
    const seasonalTrends = this.calculateSeasonalTrends(sales)

    return {
      salesConversionRate: Number(salesConversionRate.toFixed(2)),
      averageTimeToSale,
      customerRetention: 0, // 暂时设为0，需要客户数据
      seasonalTrends,
      popularBreeds
    }
  }

  private calculateMonthlyTrends(sales: any[], purchases: any[], expenses: any[]) {
    const trends: Record<string, { revenue: number; expenses: number; profit: number }> = {}
    
    // 处理销售数据
    sales.forEach(sale => {
      const month = new Date(sale.sale_date).toISOString().slice(0, 7)
      if (!trends[month]) trends[month] = { revenue: 0, expenses: 0, profit: 0 }
      trends[month].revenue += sale.amount
    })

    // 处理采购数据
    purchases.forEach(purchase => {
      const month = new Date(purchase.purchase_date).toISOString().slice(0, 7)
      if (!trends[month]) trends[month] = { revenue: 0, expenses: 0, profit: 0 }
      trends[month].expenses += purchase.amount
    })

    // 处理支出数据
    expenses.forEach(expense => {
      const month = new Date(expense.expense_date).toISOString().slice(0, 7)
      if (!trends[month]) trends[month] = { revenue: 0, expenses: 0, profit: 0 }
      trends[month].expenses += expense.amount
    })

    // 计算利润
    Object.keys(trends).forEach(month => {
      trends[month].profit = trends[month].revenue - trends[month].expenses
    })

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // 最近12个月
      .map(([month, data]) => ({ month, ...data }))
  }

  private calculateHealthTrends(healthRecords: any[]) {
    const trends: Record<string, { treatments: number; vaccinations: number; checkups: number }> = {}
    
    healthRecords.forEach(record => {
      const month = new Date(record.date).toISOString().slice(0, 7)
      if (!trends[month]) trends[month] = { treatments: 0, vaccinations: 0, checkups: 0 }
      
      switch (record.type) {
        case 'treatment':
          trends[month].treatments++
          break
        case 'vaccination':
          trends[month].vaccinations++
          break
        case 'checkup':
          trends[month].checkups++
          break
      }
    })

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // 最近6个月
      .map(([month, data]) => ({ month, ...data }))
  }

  private calculateBreedingTrends(litters: any[]) {
    const trends: Record<string, { births: number; pregnancies: number }> = {}
    
    litters.forEach(litter => {
      const matingMonth = new Date(litter.mating_date).toISOString().slice(0, 7)
      if (!trends[matingMonth]) trends[matingMonth] = { births: 0, pregnancies: 0 }
      trends[matingMonth].pregnancies++
      
      if (litter.birth_date) {
        const birthMonth = new Date(litter.birth_date).toISOString().slice(0, 7)
        if (!trends[birthMonth]) trends[birthMonth] = { births: 0, pregnancies: 0 }
        trends[birthMonth].births++
      }
    })

    return Object.entries(trends)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // 最近12个月
      .map(([month, data]) => ({ month, ...data }))
  }

  private categorizeHealthIssue(description: string): string {
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('皮肤') || lowerDesc.includes('皮炎')) return '皮肤疾病'
    if (lowerDesc.includes('消化') || lowerDesc.includes('腹泻') || lowerDesc.includes('呕吐')) return '消化系统'
    if (lowerDesc.includes('呼吸') || lowerDesc.includes('咳嗽')) return '呼吸系统'
    if (lowerDesc.includes('眼') || lowerDesc.includes('眼睛')) return '眼部疾病'
    if (lowerDesc.includes('关节') || lowerDesc.includes('骨')) return '骨关节'
    if (lowerDesc.includes('感冒') || lowerDesc.includes('发烧')) return '感冒发烧'
    return '其他'
  }

  private calculateAverageTimeToSale(sales: any[], dogs: any[]): number {
    let totalDays = 0
    let count = 0

    sales.forEach(sale => {
      const dog = dogs.find(d => d.id === sale.dog_id)
      if (dog) {
        const createTime = new Date(dog.created_at).getTime()
        const saleTime = new Date(sale.sale_date).getTime()
        const days = (saleTime - createTime) / (1000 * 60 * 60 * 24)
        if (days > 0) {
          totalDays += days
          count++
        }
      }
    })

    return count > 0 ? Number((totalDays / count).toFixed(1)) : 0
  }

  private calculateBreedPopularity(dogs: any[], sales: any[]) {
    const breedStats: Record<string, { count: number; sold: number; totalPrice: number }> = {}
    
    dogs.forEach(dog => {
      if (!breedStats[dog.breed]) {
        breedStats[dog.breed] = { count: 0, sold: 0, totalPrice: 0 }
      }
      breedStats[dog.breed].count++
    })

    return Object.entries(breedStats)
      .map(([breed, stats]) => ({
        breed,
        count: stats.count,
        averagePrice: stats.sold > 0 ? Number((stats.totalPrice / stats.sold).toFixed(2)) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // 前10个品种
  }

  private calculateSeasonalTrends(sales: any[]): Record<string, number> {
    const seasons = { spring: 0, summer: 0, autumn: 0, winter: 0 }
    
    sales.forEach(sale => {
      const month = new Date(sale.sale_date).getMonth() + 1
      if (month >= 3 && month <= 5) seasons.spring++
      else if (month >= 6 && month <= 8) seasons.summer++
      else if (month >= 9 && month <= 11) seasons.autumn++
      else seasons.winter++
    })

    return seasons
  }

  private getEmptyOverview() {
    return {
      totalDogs: 0,
      activeDogs: 0,
      soldDogs: 0,
      forSaleDogs: 0,
      averageAge: 0,
      breedDistribution: {}
    }
  }

  private getEmptyHealthData() {
    return {
      totalHealthRecords: 0,
      vaccinationCoverage: 0,
      treatmentCosts: 0,
      commonHealthIssues: {},
      averageHealthCostPerDog: 0,
      recentHealthTrends: []
    }
  }

  private getEmptyBreedingData() {
    return {
      totalLitters: 0,
      activePregnancies: 0,
      completedBirths: 0,
      averageLitterSize: 0,
      breedingSuccessRate: 0,
      monthlyBirths: []
    }
  }
}

export const dataCollector = new DataCollector()
