-- 宠物繁育管理系统数据库优化脚本
-- 解决保存慢的问题

-- 1. 简化并优化 RLS 策略
-- 删除现有策略
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON dogs;
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON purchases;
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON sales;
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON expenses;
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON litters;
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON health_records;
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON growth_timeline;
DROP POLICY IF EXISTS "用户只能操作自己的数据" ON dog_qrcodes;

-- 创建优化的 RLS 策略
-- Dogs 表策略
CREATE POLICY "dogs_user_policy" ON dogs 
FOR ALL USING (auth.uid() = user_id);

-- Purchases 表策略
CREATE POLICY "purchases_user_policy" ON purchases 
FOR ALL USING (auth.uid() = user_id);

-- Sales 表策略
CREATE POLICY "sales_user_policy" ON sales 
FOR ALL USING (auth.uid() = user_id);

-- Expenses 表策略
CREATE POLICY "expenses_user_policy" ON expenses 
FOR ALL USING (auth.uid() = user_id);

-- Litters 表策略
CREATE POLICY "litters_user_policy" ON litters 
FOR ALL USING (auth.uid() = user_id);

-- Health records 表策略
CREATE POLICY "health_records_user_policy" ON health_records 
FOR ALL USING (auth.uid() = user_id);

-- Growth timeline 表策略
CREATE POLICY "growth_timeline_user_policy" ON growth_timeline 
FOR ALL USING (auth.uid() = user_id);

-- QR codes 表策略
CREATE POLICY "dog_qrcodes_user_policy" ON dog_qrcodes 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM dogs WHERE dogs.id = dog_qrcodes.dog_id AND dogs.user_id = auth.uid()
  )
);

-- 2. 添加缺失的复合索引以提高性能
-- Dogs 表索引
CREATE INDEX IF NOT EXISTS idx_dogs_user_status ON dogs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dogs_user_breed ON dogs(user_id, breed);
CREATE INDEX IF NOT EXISTS idx_dogs_birth_date ON dogs(birth_date);
CREATE INDEX IF NOT EXISTS idx_dogs_sire_dam ON dogs(sire_id, dam_id);

-- Purchases 表索引
CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON purchases(user_id, purchase_date);

-- Sales 表索引
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, sale_date);

-- Expenses 表索引
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);

-- Health records 表索引
CREATE INDEX IF NOT EXISTS idx_health_records_user_type ON health_records(user_id, type);
CREATE INDEX IF NOT EXISTS idx_health_records_user_date ON health_records(user_id, date);

-- Growth timeline 表索引
CREATE INDEX IF NOT EXISTS idx_growth_timeline_user_date ON growth_timeline(user_id, event_date);

-- 3. 优化表结构（如果需要）
-- 确保所有日期字段都有适当的默认值
ALTER TABLE dogs ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE purchases ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE sales ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE expenses ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE litters ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE health_records ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE growth_timeline ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE dog_qrcodes ALTER COLUMN updated_at SET DEFAULT TIMEZONE('utc'::text, NOW());

-- 4. 创建一些有用的视图来加速查询
-- 创建狗狗详情视图（包含基本统计）
CREATE OR REPLACE VIEW dog_details AS
SELECT 
  d.*,
  COALESCE(p.total_purchase_cost, 0) as total_purchase_cost,
  COALESCE(s.total_sale_price, 0) as total_sale_price,
  COALESCE(e.total_expenses, 0) as total_expenses,
  COALESCE(s.total_sale_price, 0) - COALESCE(p.total_purchase_cost, 0) - COALESCE(e.total_expenses, 0) as net_profit
FROM dogs d
LEFT JOIN (
  SELECT dog_id, SUM(price) as total_purchase_cost
  FROM purchases
  GROUP BY dog_id
) p ON d.id = p.dog_id
LEFT JOIN (
  SELECT dog_id, SUM(price) as total_sale_price
  FROM sales
  GROUP BY dog_id
) s ON d.id = s.dog_id
LEFT JOIN (
  SELECT dog_id, SUM(amount) as total_expenses
  FROM expenses
  GROUP BY dog_id
) e ON d.id = e.dog_id;

-- 5. 优化 Supabase 特定设置
-- 启用实时订阅（如果需要）
-- ALTER PUBLICATION supabase_realtime ADD TABLE dogs;
-- ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
-- ALTER PUBLICATION supabase_realtime ADD TABLE sales;
-- ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

-- 6. 创建一些有用的函数
-- 计算狗狗年龄的函数
CREATE OR REPLACE FUNCTION calculate_dog_age(birth_date DATE)
RETURNS TEXT AS $$
DECLARE
  age_years INTEGER;
  age_months INTEGER;
  age_days INTEGER;
BEGIN
  age_years := DATE_PART('year', AGE(CURRENT_DATE, birth_date));
  age_months := DATE_PART('month', AGE(CURRENT_DATE, birth_date));
  age_days := DATE_PART('day', AGE(CURRENT_DATE, birth_date));
  
  IF age_years > 0 THEN
    IF age_months > 0 THEN
      RETURN age_years || '岁' || age_months || '个月';
    ELSE
      RETURN age_years || '岁';
    END IF;
  ELSIF age_months > 0 THEN
    RETURN age_months || '个月';
  ELSE
    RETURN age_days || '天';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 完成优化
-- 运行 ANALYZE 来更新统计信息
ANALYZE dogs;
ANALYZE purchases;
ANALYZE sales;
ANALYZE expenses;
ANALYZE litters;
ANALYZE health_records;
ANALYZE growth_timeline;
ANALYZE dog_qrcodes; 