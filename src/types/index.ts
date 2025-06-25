// 狗狗信息类型
export type Dog = {
  id: string; // UUID
  name: string;
  breed: string;
  gender: 'male' | 'female';
  birth_date: string; // YYYY-MM-DD
  color: string; // 颜色
  weight?: number; // 体重
  microchip_id?: string; // 芯片号
  registration_number?: string; // 注册号
  owner_contact?: string; // 主人联系方式
  status?: 'owned' | 'sold' | 'deceased' | 'returned';
  photo_urls?: string[];
  sire_id?: string; // 父亲狗 ID
  dam_id?: string; // 母亲狗 ID
  notes?: string; // 备注
  created_at: string;
  updated_at?: string;
};

// 进货记录类型
export type Purchase = {
  id: string;
  dog_id: string;
  amount: number;
  purchase_date: string;
  supplier?: string;
  supplier_contact?: string;
  notes?: string;
  created_at: string;
  dogs?: {
    name: string;
    breed: string;
    gender: 'male' | 'female';
  };
};

// 售出记录类型
export type Sale = {
  id: string;
  dog_id: string;
  amount: number;
  sale_date: string;
  buyer_name?: string;
  buyer_contact?: string;
  notes?: string;
  created_at: string;
  dogs?: {
    name: string;
    breed: string;
    gender: 'male' | 'female';
  };
};

// 花销记录类型
export type Expense = {
  id: string;
  dog_id: string;
  category: 'medical' | 'food' | 'grooming' | 'other';
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
};

// 繁殖记录类型
export type Litter = {
  id: string;
  sire_id: string;
  dam_id: string;
  birth_date: string;
  puppy_ids: string[]; // 对应 dogs 表的 ID
  created_at: string;
};

// 健康记录类型
export type HealthRecord = {
  id: string;
  dog_id: string;
  type: 'vaccination' | 'checkup' | 'treatment';
  date: string;
  description: string;
  document_url?: string;
  created_at: string;
};

// 成长档案类型
export type GrowthEvent = {
  id: string;
  dog_id: string;
  event_date: string;
  photo_url?: string;
  notes?: string;
  created_at: string;
};

// 二维码类型
export type QrCode = {
  dog_id: string;
  qrcode_url: string;
  updated_at: string;
};

// 用户类型
export type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
};

// 财务统计类型
export type FinancialSummary = {
  total_purchases: number;
  total_sales: number;
  total_expenses: number;
  net_profit: number;
  dog_count: number;
};

// 状态管理类型
export type AppState = {
  user: User | null;
  dogs: Dog[];
  selectedDog: Dog | null;
  loading: boolean;
  error: string | null;
}; 