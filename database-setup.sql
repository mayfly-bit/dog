-- 宠物繁育管理系统数据库初始化脚本
-- 在 Supabase SQL Editor 中执行此脚本

-- 创建狗狗信息表
CREATE TABLE dogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  breed VARCHAR NOT NULL,
  gender VARCHAR CHECK (gender IN ('male', 'female')) NOT NULL,
  birth_date DATE NOT NULL,
  status VARCHAR CHECK (status IN ('owned', 'sold', 'deceased', 'returned')) DEFAULT 'owned',
  photo_urls TEXT[],
  sire_id UUID REFERENCES dogs(id),
  dam_id UUID REFERENCES dogs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- 创建进货记录表
CREATE TABLE purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- 创建销售记录表
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL,
  buyer_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- 创建支出记录表
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR CHECK (category IN ('medical', 'food', 'grooming', 'other')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- 创建繁殖记录表
CREATE TABLE litters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sire_id UUID REFERENCES dogs(id) NOT NULL,
  dam_id UUID REFERENCES dogs(id) NOT NULL,
  birth_date DATE NOT NULL,
  puppy_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- 创建健康记录表
CREATE TABLE health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR CHECK (type IN ('vaccination', 'checkup', 'treatment')) NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- 创建成长档案表
CREATE TABLE growth_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  event_date DATE NOT NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL
);

-- 创建二维码表
CREATE TABLE dog_qrcodes (
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE PRIMARY KEY,
  qrcode_url TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 启用行级安全策略 (RLS)
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE litters ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE dog_qrcodes ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户只能操作自己的数据" ON dogs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON litters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON health_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON growth_timeline FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的数据" ON dog_qrcodes FOR ALL USING (
  auth.uid() = (SELECT user_id FROM dogs WHERE id = dog_qrcodes.dog_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_dogs_status ON dogs(status);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_dog_id ON purchases(dog_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_dog_id ON sales(dog_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_dog_id ON expenses(dog_id);
CREATE INDEX idx_health_records_user_id ON health_records(user_id);
CREATE INDEX idx_health_records_dog_id ON health_records(dog_id);
CREATE INDEX idx_growth_timeline_user_id ON growth_timeline(user_id);
CREATE INDEX idx_growth_timeline_dog_id ON growth_timeline(dog_id); 