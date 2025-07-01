import { supabase } from './supabase'

interface DogDetail {
  id: string
  name: string
  breed: string
  gender: 'male' | 'female'
  birth_date: string
  purchase_date?: string
  purchase_price?: number
  sale_date?: string
  sale_price?: number
  status: 'owned' | 'sold' | 'for_sale'
  age_months: number
  weight?: number
  health_score?: number
  last_health_check?: string
  vaccination_records: Array<{
    vaccine_type: string
    date: string
    next_due?: string
    veterinarian?: string
    cost?: number
  }>
  breeding_records: Array<{
    type: 'mating' | 'pregnancy' | 'birth'
    date: string
    partner_id?: string
    partner_name?: string
    status?: string
    expected_date?: string
    actual_date?: string
    puppies_count?: number
    notes?: string
  }>
  financial_records: Array<{
    type: 'purchase' | 'sale' | 'expense'
    date: string
    amount: number
    description?: string
    category?: string
  }>
}

interface BreedingAnalysis {
  female_dogs: Array<{
    id: string
    name: string
    breed: string
    age_months: number
    last_heat_cycle?: string
    estimated_next_heat?: string
    breeding_status: 'available' | 'pregnant' | 'nursing' | 'too_young' | 'too_old'
    pregnancy_details?: {
      mating_date: string
      expected_birth: string
      current_stage: string
      days_pregnant: number
      partner_info: {
        id: string
        name: string
        breed: string
      }
    }
    breeding_history: Array<{
      date: string
      partner: string
      outcome: string
      puppies_count?: number
    }>
  }>
  male_dogs: Array<{
    id: string
    name: string
    breed: string
    age_months: number
    breeding_status: 'available' | 'too_young' | 'retired'
    breeding_history: Array<{
      date: string
      female_partner: string
      outcome: string
      puppies_count?: number
    }>
  }>
}

interface FinancialAnalysis {
  dogs_financial: Array<{
    id: string
    name: string
    breed: string
    purchase_price: number
    sale_price?: number
    current_market_value?: number
    total_expenses: number
    profit_loss: number
    roi_percentage: number
    expense_breakdown: {
      food: number
      healthcare: number
      breeding: number
      grooming: number
      other: number
    }
    monthly_costs: Array<{
      month: string
      amount: number
      category: string
    }>
  }>
  breeding_profitability: Array<{
    litter_id: string
    mother_name: string
    father_name: string
    birth_date: string
    puppies_count: number
    puppies_sold: number
    total_revenue: number
    total_costs: number
    net_profit: number
    cost_per_puppy: number
    average_sale_price: number
  }>
}

interface HealthAnalysis {
  dogs_health: Array<{
    id: string
    name: string
    breed: string
    age_months: number
    health_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    vaccination_status: {
      core_vaccines: {
        rabies: { last_date: string; next_due: string; status: 'current' | 'due' | 'overdue' }
        dhpp: { last_date: string; next_due: string; status: 'current' | 'due' | 'overdue' }
        bordetella: { last_date: string; next_due: string; status: 'current' | 'due' | 'overdue' }
      }
      optional_vaccines: Array<{
        type: string
        last_date: string
        next_due: string
        status: 'current' | 'due' | 'overdue'
      }>
    }
    health_records: Array<{
      date: string
      type: 'vaccination' | 'checkup' | 'treatment' | 'surgery'
      description: string
      veterinarian?: string
      cost?: number
      follow_up_date?: string
    }>
    upcoming_care: Array<{
      type: 'vaccination' | 'checkup' | 'treatment'
      due_date: string
      description: string
      estimated_cost?: number
      priority: 'urgent' | 'important' | 'routine'
    }>
  }>
}

// 添加重试机制的数据获取函数
async function fetchDataWithRetry(tableName: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 获取 ${tableName} 数据 (尝试 ${attempt}/${maxRetries})`)
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) throw error
      console.log(`✅ ${tableName} 数据获取成功: ${data?.length || 0} 条`)
      return data || []
    } catch (error) {
      console.log(`❌ ${tableName} 数据获取失败 (尝试 ${attempt}/${maxRetries}):`, error)
      if (attempt === maxRetries) throw error
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  return []
}

export async function collectComprehensiveBusinessData() {
  try {
    console.log('🔍 开始全面业务数据收集...')
    
    // 串行收集基础数据，避免并发问题
    console.log('📊 收集狗狗数据...')
    const dogs = await fetchDataWithRetry('dogs')
    
    console.log('💰 收集销售数据...')
    const sales = await fetchDataWithRetry('sales')
    
    console.log('🛒 收集采购数据...')
    const purchases = await fetchDataWithRetry('purchases')
    
    console.log('💸 收集支出数据...')
    const expenses = await fetchDataWithRetry('expenses')
    
    console.log('🏥 收集健康记录...')
    const healthRecords = await fetchDataWithRetry('health_records')
    
    console.log('🐕‍🦺 收集产仔记录...')
    const litters = await fetchDataWithRetry('litters')

    console.log(`📊 基础数据统计: 狗狗${dogs.length}只, 销售${sales.length}条, 采购${purchases.length}条, 支出${expenses.length}条, 健康记录${healthRecords.length}条, 产仔记录${litters.length}条`)
    
    // 验证关键数据
    if (dogs.length === 0) {
      console.log('⚠️  警告: 没有找到狗狗数据，检查数据库连接')
      // 尝试简单查询验证连接
      const testQuery = await supabase.from('dogs').select('count', { count: 'exact' })
      console.log('🔍 数据库连接测试:', testQuery)
    }

    // 1. 构建详细的狗狗数据
    const dogsDetail: DogDetail[] = dogs.map(dog => {
      const dogSales = sales.filter(s => s.dog_id === dog.id)
      const dogPurchases = purchases.filter(p => p.dog_id === dog.id)
      const dogExpenses = expenses.filter(e => e.dog_id === dog.id)
      const dogHealth = healthRecords.filter(h => h.dog_id === dog.id)
      const dogBreeding = litters.filter(l => l.mother_id === dog.id || l.father_id === dog.id)

      const birthDate = new Date(dog.birth_date)
      const ageMonths = Math.floor((Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))

      // 疫苗记录处理
      const vaccinationRecords = dogHealth
        .filter(h => h.record_type === 'vaccination')
        .map(v => ({
          vaccine_type: v.treatment_type || v.description || '未知疫苗',
          date: v.record_date,
          next_due: calculateNextVaccination(v.treatment_type, v.record_date),
          veterinarian: v.veterinarian,
          cost: v.cost || 0
        }))

      // 繁育记录处理
      const breedingRecords = dogBreeding.map(breeding => ({
        type: breeding.birth_date ? 'birth' : 'mating' as 'mating' | 'pregnancy' | 'birth',
        date: breeding.mating_date || breeding.birth_date,
        partner_id: dog.id === breeding.mother_id ? breeding.father_id : breeding.mother_id,
        partner_name: dog.id === breeding.mother_id ? 
          dogs.find(d => d.id === breeding.father_id)?.name : 
          dogs.find(d => d.id === breeding.mother_id)?.name,
        status: breeding.status,
        expected_date: breeding.expected_birth_date,
        actual_date: breeding.birth_date,
        puppies_count: breeding.puppies_count,
        notes: breeding.notes
      }))

      // 财务记录处理
      const financialRecords = [
        ...dogPurchases.map(p => ({
          type: 'purchase' as const,
          date: p.purchase_date,
          amount: p.amount || 0,
          description: p.notes,
          category: 'purchase'
        })),
        ...dogSales.map(s => ({
          type: 'sale' as const,
          date: s.sale_date,
          amount: s.amount || 0,
          description: s.notes,
          category: 'sale'
        })),
        ...dogExpenses.map(e => ({
          type: 'expense' as const,
          date: e.expense_date,
          amount: e.amount || 0,
          description: e.description,
          category: e.category
        }))
      ]

      return {
        id: dog.id,
        name: dog.name,
        breed: dog.breed,
        gender: dog.gender,
        birth_date: dog.birth_date,
        purchase_date: dogPurchases[0]?.purchase_date,
        purchase_price: dogPurchases[0]?.amount,
        sale_date: dogSales[0]?.sale_date,
        sale_price: dogSales[0]?.amount,
        status: dog.status,
        age_months: ageMonths,
        weight: dog.weight,
        health_score: calculateHealthScore(dogHealth),
        last_health_check: dogHealth.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime())[0]?.record_date,
        vaccination_records: vaccinationRecords,
        breeding_records: breedingRecords,
        financial_records: financialRecords
      }
    })

    // 2. 繁育分析数据
    const breedingAnalysis: BreedingAnalysis = {
      female_dogs: dogsDetail.filter(dog => dog.gender === 'female').map(dog => {
        const lastHeat = estimateLastHeatCycle(dog.breeding_records, dog.age_months)
        const nextHeat = estimateNextHeatCycle(lastHeat, dog.age_months)
        const pregnancyInfo = getCurrentPregnancyInfo(dog.breeding_records, dogs)
        
        return {
          id: dog.id,
          name: dog.name,
          breed: dog.breed,
          age_months: dog.age_months,
          last_heat_cycle: lastHeat,
          estimated_next_heat: nextHeat,
          breeding_status: determineBreedingStatus(dog.age_months, pregnancyInfo),
          pregnancy_details: pregnancyInfo,
          breeding_history: getBreedingHistory(dog.breeding_records)
        }
      }),
      male_dogs: dogsDetail.filter(dog => dog.gender === 'male').map(dog => ({
        id: dog.id,
        name: dog.name,
        breed: dog.breed,
        age_months: dog.age_months,
        breeding_status: dog.age_months < 8 ? 'too_young' : dog.age_months > 96 ? 'retired' : 'available',
        breeding_history: getBreedingHistory(dog.breeding_records)
      }))
    }

    // 3. 财务分析数据
    const financialAnalysis: FinancialAnalysis = {
      dogs_financial: dogsDetail.map(dog => {
        const totalExpenses = dog.financial_records
          .filter(r => r.type === 'expense')
          .reduce((sum, r) => sum + r.amount, 0)
        
        const purchasePrice = dog.purchase_price || 0
        const salePrice = dog.sale_price || 0
        const profitLoss = salePrice - purchasePrice - totalExpenses
        const roi = purchasePrice > 0 ? ((profitLoss / purchasePrice) * 100) : 0

        return {
          id: dog.id,
          name: dog.name,
          breed: dog.breed,
          purchase_price: purchasePrice,
          sale_price: salePrice,
          current_market_value: estimateMarketValue(dog.breed, dog.age_months, dog.gender),
          total_expenses: totalExpenses,
          profit_loss: profitLoss,
          roi_percentage: roi,
          expense_breakdown: categorizeExpenses(dog.financial_records),
          monthly_costs: getMonthlyExpenses(dog.financial_records)
        }
      }),
      breeding_profitability: calculateBreedingProfitability(litters, dogs, sales, expenses)
    }

    // 4. 健康分析数据
    const healthAnalysis: HealthAnalysis = {
      dogs_health: dogsDetail.map(dog => ({
        id: dog.id,
        name: dog.name,
        breed: dog.breed,
        age_months: dog.age_months,
        health_status: assessHealthStatus(dog.health_score, dog.age_months),
        vaccination_status: analyzeVaccinationStatus(dog.vaccination_records, dog.age_months),
        health_records: dog.vaccination_records.map(v => ({
          date: v.date,
          type: 'vaccination',
          description: v.vaccine_type,
          veterinarian: v.veterinarian,
          cost: v.cost
        })),
        upcoming_care: generateUpcomingCare(dog.vaccination_records, dog.age_months, dog.health_score)
      }))
    }

    const result = {
      collection_time: new Date().toISOString(),
      summary: {
        total_dogs: dogs.length,
        female_dogs: dogs.filter(d => d.gender === 'female').length,
        male_dogs: dogs.filter(d => d.gender === 'male').length,
        active_breeding_females: breedingAnalysis.female_dogs.filter(f => f.breeding_status === 'available').length,
        pregnant_females: breedingAnalysis.female_dogs.filter(f => f.breeding_status === 'pregnant').length,
        total_revenue: sales.reduce((sum, s) => sum + (s.amount || 0), 0),
        total_expenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        health_alerts: healthAnalysis.dogs_health.filter(h => h.upcoming_care.some(c => c.priority === 'urgent')).length
      },
      dogs_detail: dogsDetail,
      breeding_analysis: breedingAnalysis,
      financial_analysis: financialAnalysis,
      health_analysis: healthAnalysis
    }

    console.log('✅ 全面数据收集完成')
    console.log(`📋 数据摘要: ${dogs.length}只狗狗, ${breedingAnalysis.female_dogs.length}只母狗, ${breedingAnalysis.male_dogs.length}只公狗`)
    
    return result

  } catch (error) {
    console.error('❌ 数据收集失败:', error)
    throw error
  }
}

// 辅助函数
function calculateNextVaccination(vaccineType: string, lastDate: string): string {
  const last = new Date(lastDate)
  const intervals: { [key: string]: number } = {
    '狂犬病': 365,
    'DHPP': 365,
    '犬瘟': 365,
    '细小': 365,
    '传染性肝炎': 365,
    '副流感': 365,
    '犬窝咳': 365,
    '莱姆病': 365,
    '钩端螺旋体': 365
  }
  
  const interval = intervals[vaccineType] || 365
  const nextDate = new Date(last.getTime() + interval * 24 * 60 * 60 * 1000)
  return nextDate.toISOString().split('T')[0]
}

function calculateHealthScore(healthRecords: any[]): number {
  if (healthRecords.length === 0) return 70
  
  const recentRecords = healthRecords
    .filter(r => new Date(r.record_date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
  
  let score = 80
  const vaccinationCount = recentRecords.filter(r => r.record_type === 'vaccination').length
  const treatmentCount = recentRecords.filter(r => r.record_type === 'treatment').length
  
  score += Math.min(vaccinationCount * 5, 20)
  score -= Math.min(treatmentCount * 10, 30)
  
  return Math.max(0, Math.min(100, score))
}

function estimateLastHeatCycle(breedingRecords: any[], ageMonths: number): string | undefined {
  const matingRecords = breedingRecords.filter(r => r.type === 'mating')
  if (matingRecords.length > 0) {
    const lastMating = matingRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    return lastMating.date
  }
  
  if (ageMonths >= 6) {
    const estimatedDate = new Date()
    estimatedDate.setMonth(estimatedDate.getMonth() - Math.floor(Math.random() * 6) - 1)
    return estimatedDate.toISOString().split('T')[0]
  }
  
  return undefined
}

function estimateNextHeatCycle(lastHeat: string | undefined, ageMonths: number): string | undefined {
  if (!lastHeat || ageMonths < 6) return undefined
  
  const last = new Date(lastHeat)
  const nextCycle = new Date(last.getTime() + (6 * 30.44 * 24 * 60 * 60 * 1000))
  return nextCycle.toISOString().split('T')[0]
}

function getCurrentPregnancyInfo(breedingRecords: any[], allDogs: any[]): any {
  const pregnancyRecord = breedingRecords
    .filter(r => r.type === 'mating' && !r.actual_date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  
  if (!pregnancyRecord) return undefined
  
  const matingDate = new Date(pregnancyRecord.date)
  const expectedBirth = new Date(matingDate.getTime() + (63 * 24 * 60 * 60 * 1000))
  const daysPregnant = Math.floor((Date.now() - matingDate.getTime()) / (24 * 60 * 60 * 1000))
  
  if (daysPregnant > 70) return undefined
  
  const partner = allDogs.find(d => d.id === pregnancyRecord.partner_id)
  
  return {
    mating_date: pregnancyRecord.date,
    expected_birth: expectedBirth.toISOString().split('T')[0],
    current_stage: getPregnancyStage(daysPregnant),
    days_pregnant: daysPregnant,
    partner_info: partner ? {
      id: partner.id,
      name: partner.name,
      breed: partner.breed
    } : null
  }
}

function getPregnancyStage(days: number): string {
  if (days < 21) return '早期妊娠'
  if (days < 42) return '中期妊娠'
  if (days < 63) return '晚期妊娠'
  return '临产期'
}

function determineBreedingStatus(ageMonths: number, pregnancyInfo: any): 'available' | 'pregnant' | 'nursing' | 'too_young' | 'too_old' {
  if (ageMonths < 6) return 'too_young'
  if (ageMonths > 96) return 'too_old'
  if (pregnancyInfo) return 'pregnant'
  return 'available'
}

function getBreedingHistory(breedingRecords: any[]): any[] {
  return breedingRecords
    .filter(r => r.type === 'birth')
    .map(r => ({
      date: r.date,
      partner: r.partner_name || '未知',
      outcome: r.puppies_count > 0 ? '成功' : '失败',
      puppies_count: r.puppies_count
    }))
}

function estimateMarketValue(breed: string, ageMonths: number, gender: string): number {
  const baseValues: { [key: string]: number } = {
    '金毛': 3000,
    '拉布拉多': 2800,
    '德牧': 3500,
    '泰迪': 2000,
    '比熊': 2200,
    '萨摩耶': 3200
  }
  
  let value = baseValues[breed] || 2500
  
  if (ageMonths < 3) value *= 1.2
  else if (ageMonths < 12) value *= 1.0
  else if (ageMonths < 24) value *= 0.8
  else value *= 0.6
  
  if (gender === 'female' && ageMonths >= 6 && ageMonths <= 60) value *= 1.1
  
  return Math.round(value)
}

function categorizeExpenses(financialRecords: any[]): any {
  const expenses = financialRecords.filter(r => r.type === 'expense')
  const categories = {
    food: 0,
    healthcare: 0,
    breeding: 0,
    grooming: 0,
    other: 0
  }
  
  expenses.forEach(expense => {
    const category = expense.category?.toLowerCase() || 'other'
    if (category.includes('食') || category.includes('粮')) categories.food += expense.amount
    else if (category.includes('医') || category.includes('疫苗') || category.includes('治疗')) categories.healthcare += expense.amount
    else if (category.includes('配种') || category.includes('繁殖')) categories.breeding += expense.amount
    else if (category.includes('美容') || category.includes('洗澡')) categories.grooming += expense.amount
    else categories.other += expense.amount
  })
  
  return categories
}

function getMonthlyExpenses(financialRecords: any[]): any[] {
  const expenses = financialRecords.filter(r => r.type === 'expense')
  const monthlyMap = new Map()
  
  expenses.forEach(expense => {
    const month = expense.date.substring(0, 7)
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { month, amount: 0, category: expense.category || 'other' })
    }
    monthlyMap.get(month).amount += expense.amount
  })
  
  return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
}

function calculateBreedingProfitability(litters: any[], dogs: any[], sales: any[], expenses: any[]): any[] {
  return litters.map(litter => {
    const mother = dogs.find(d => d.id === litter.mother_id)
    const father = dogs.find(d => d.id === litter.father_id)
    const litterSales = sales.filter(s => s.litter_id === litter.id)
    const litterExpenses = expenses.filter(e => e.litter_id === litter.id)
    
    const totalRevenue = litterSales.reduce((sum, s) => sum + (s.amount || 0), 0)
    const totalCosts = litterExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    
    return {
      litter_id: litter.id,
      mother_name: mother?.name || '未知',
      father_name: father?.name || '未知',
      birth_date: litter.birth_date,
      puppies_count: litter.puppies_count || 0,
      puppies_sold: litterSales.length,
      total_revenue: totalRevenue,
      total_costs: totalCosts,
      net_profit: totalRevenue - totalCosts,
      cost_per_puppy: litter.puppies_count > 0 ? totalCosts / litter.puppies_count : 0,
      average_sale_price: litterSales.length > 0 ? totalRevenue / litterSales.length : 0
    }
  })
}

function assessHealthStatus(healthScore: number | undefined, ageMonths: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  const score = healthScore || 70
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'fair'
  if (score >= 60) return 'poor'
  return 'critical'
}

function analyzeVaccinationStatus(vaccinations: any[], ageMonths: number): any {
  const coreVaccines = {
    rabies: { last_date: '', next_due: '', status: 'overdue' as 'current' | 'due' | 'overdue' },
    dhpp: { last_date: '', next_due: '', status: 'overdue' as 'current' | 'due' | 'overdue' },
    bordetella: { last_date: '', next_due: '', status: 'overdue' as 'current' | 'due' | 'overdue' }
  }
  
  vaccinations.forEach(vac => {
    const type = vac.vaccine_type.toLowerCase()
    if (type.includes('狂犬')) {
      coreVaccines.rabies.last_date = vac.date
      coreVaccines.rabies.next_due = vac.next_due || ''
      coreVaccines.rabies.status = new Date(vac.next_due) > new Date() ? 'current' : 'due'
    } else if (type.includes('dhpp') || type.includes('犬瘟') || type.includes('细小')) {
      coreVaccines.dhpp.last_date = vac.date
      coreVaccines.dhpp.next_due = vac.next_due || ''
      coreVaccines.dhpp.status = new Date(vac.next_due) > new Date() ? 'current' : 'due'
    } else if (type.includes('犬窝咳') || type.includes('博德特氏菌')) {
      coreVaccines.bordetella.last_date = vac.date
      coreVaccines.bordetella.next_due = vac.next_due || ''
      coreVaccines.bordetella.status = new Date(vac.next_due) > new Date() ? 'current' : 'due'
    }
  })
  
  return {
    core_vaccines: coreVaccines,
    optional_vaccines: vaccinations
      .filter(v => !['狂犬', 'dhpp', '犬瘟', '细小', '犬窝咳'].some(core => v.vaccine_type.toLowerCase().includes(core)))
      .map(v => ({
        type: v.vaccine_type,
        last_date: v.date,
        next_due: v.next_due || '',
        status: new Date(v.next_due) > new Date() ? 'current' as const : 'due' as const
      }))
  }
}

function generateUpcomingCare(vaccinations: any[], ageMonths: number, healthScore: number | undefined): any[] {
  const upcoming = []
  const score = healthScore || 70
  
  vaccinations.forEach(vac => {
    if (vac.next_due && new Date(vac.next_due) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      upcoming.push({
        type: 'vaccination',
        due_date: vac.next_due,
        description: `${vac.vaccine_type}疫苗接种`,
        estimated_cost: 150,
        priority: new Date(vac.next_due) <= new Date() ? 'urgent' as const : 'important' as const
      })
    }
  })
  
  if (score < 70) {
    upcoming.push({
      type: 'checkup',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '健康检查（健康评分偏低）',
      estimated_cost: 200,
      priority: 'urgent' as const
    })
  }
  
  return upcoming.sort((a, b) => a.due_date.localeCompare(b.due_date))
}
