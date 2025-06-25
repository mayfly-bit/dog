-- 数据库字段修复脚本
-- 解决字段名不匹配问题

-- 1. 修改 purchases 表：将 price 重命名为 amount，添加供应商字段
DO $$
BEGIN
    -- 检查 amount 列是否存在，如果不存在则添加
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'amount') THEN
        -- 重命名 price 为 amount
        ALTER TABLE purchases RENAME COLUMN price TO amount;
    END IF;
    
    -- 添加供应商相关字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'supplier') THEN
        ALTER TABLE purchases ADD COLUMN supplier VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'supplier_contact') THEN
        ALTER TABLE purchases ADD COLUMN supplier_contact VARCHAR;
    END IF;
END $$;

-- 2. 修改 sales 表：将 price 重命名为 amount，添加买家字段
DO $$
BEGIN
    -- 检查 amount 列是否存在，如果不存在则重命名
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'amount') THEN
        ALTER TABLE sales RENAME COLUMN price TO amount;
    END IF;
    
    -- 添加买家相关字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'buyer_name') THEN
        ALTER TABLE sales ADD COLUMN buyer_name VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'buyer_contact') THEN
        ALTER TABLE sales ADD COLUMN buyer_contact VARCHAR;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'notes') THEN
        ALTER TABLE sales ADD COLUMN notes TEXT;
    END IF;
    
    -- 如果存在 buyer_info 字段，可以选择保留或删除
    -- ALTER TABLE sales DROP COLUMN IF EXISTS buyer_info;
END $$;

-- 3. 修改 expenses 表：将 date 重命名为 expense_date，添加描述字段
DO $$
BEGIN
    -- 检查 expense_date 列是否存在，如果不存在则重命名
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'expense_date') THEN
        ALTER TABLE expenses RENAME COLUMN date TO expense_date;
    END IF;
    
    -- 添加描述字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'description') THEN
        ALTER TABLE expenses ADD COLUMN description VARCHAR;
    END IF;
    
    -- 扩展支出类别
    ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
    ALTER TABLE expenses ADD CONSTRAINT expenses_category_check 
        CHECK (category IN ('medical', 'food', 'grooming', 'breeding', 'transport', 'other'));
    
    -- 允许 dog_id 为空（针对非狗狗特定的支出）
    ALTER TABLE expenses ALTER COLUMN dog_id DROP NOT NULL;
END $$;

-- 4. 修改 dogs 表：添加进货价格和销售价格字段
DO $$
BEGIN
    -- 添加进货价格字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dogs' AND column_name = 'purchase_price') THEN
        ALTER TABLE dogs ADD COLUMN purchase_price DECIMAL(10,2);
    END IF;
    
    -- 添加销售价格字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dogs' AND column_name = 'sale_price') THEN
        ALTER TABLE dogs ADD COLUMN sale_price DECIMAL(10,2);
    END IF;
    
    -- 扩展状态选项
    ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_status_check;
    ALTER TABLE dogs ADD CONSTRAINT dogs_status_check 
        CHECK (status IN ('owned', 'available', 'sold', 'deceased', 'returned'));
END $$;

-- 5. 创建视图以便更好地查询财务数据
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
  u.id as user_id,
  COALESCE(p.total_purchases, 0) as total_purchases,
  COALESCE(s.total_sales, 0) as total_sales,
  COALESCE(e.total_expenses, 0) as total_expenses,
  COALESCE(s.total_sales, 0) - COALESCE(p.total_purchases, 0) - COALESCE(e.total_expenses, 0) as net_profit
FROM auth.users u
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_purchases
  FROM purchases 
  GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_sales
  FROM sales 
  GROUP BY user_id
) s ON u.id = s.user_id
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_expenses
  FROM expenses 
  GROUP BY user_id
) e ON u.id = e.user_id;

-- 更新索引
CREATE INDEX IF NOT EXISTS idx_purchases_amount ON purchases(amount);
CREATE INDEX IF NOT EXISTS idx_sales_amount ON sales(amount);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_dogs_prices ON dogs(purchase_price, sale_price);

-- 确保所有必要的 RLS 策略都存在
DO $$
BEGIN
    -- 删除可能存在的旧策略
    DROP POLICY IF EXISTS "用户只能操作自己的数据" ON dogs;
    DROP POLICY IF EXISTS "用户只能操作自己的数据" ON purchases;
    DROP POLICY IF EXISTS "用户只能操作自己的数据" ON sales;
    DROP POLICY IF EXISTS "用户只能操作自己的数据" ON expenses;
    
    -- 重新创建策略
    CREATE POLICY "用户只能操作自己的狗狗数据" ON dogs FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "用户只能操作自己的进货数据" ON purchases FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "用户只能操作自己的销售数据" ON sales FOR ALL USING (auth.uid() = user_id);
    CREATE POLICY "用户只能操作自己的支出数据" ON expenses FOR ALL USING (auth.uid() = user_id);
END $$; 