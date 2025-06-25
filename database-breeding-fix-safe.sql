-- 繁殖管理数据库修复脚本（安全版本）
-- 修复 litters 表的外键关系和字段，不包含示例数据

-- 1. 删除现有的 litters 表（如果存在）
DROP TABLE IF EXISTS litters CASCADE;

-- 2. 重新创建 litters 表，确保外键关系正确
CREATE TABLE litters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mother_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    father_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    mating_date DATE NOT NULL,
    expected_birth_date DATE NOT NULL,
    birth_date DATE,
    puppy_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引以提高查询性能
CREATE INDEX idx_litters_user_id ON litters(user_id);
CREATE INDEX idx_litters_mother_id ON litters(mother_id);
CREATE INDEX idx_litters_father_id ON litters(father_id);
CREATE INDEX idx_litters_mating_date ON litters(mating_date);
CREATE INDEX idx_litters_expected_birth_date ON litters(expected_birth_date);
CREATE INDEX idx_litters_birth_date ON litters(birth_date);

-- 4. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_litters_updated_at 
    BEFORE UPDATE ON litters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 设置行级安全策略 (RLS)
ALTER TABLE litters ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view their own litters" ON litters;
DROP POLICY IF EXISTS "Users can insert their own litters" ON litters;
DROP POLICY IF EXISTS "Users can update their own litters" ON litters;
DROP POLICY IF EXISTS "Users can delete their own litters" ON litters;

-- 用户只能查看自己的繁殖记录
CREATE POLICY "Users can view their own litters" ON litters
    FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的繁殖记录
CREATE POLICY "Users can insert their own litters" ON litters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的繁殖记录
CREATE POLICY "Users can update their own litters" ON litters
    FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的繁殖记录
CREATE POLICY "Users can delete their own litters" ON litters
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 确保 dogs 表有正确的父母关系字段（如果不存在）
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS father_id UUID REFERENCES dogs(id);
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS mother_id UUID REFERENCES dogs(id);

-- 7. 为 dogs 表的父母关系创建索引
CREATE INDEX IF NOT EXISTS idx_dogs_father_id ON dogs(father_id);
CREATE INDEX IF NOT EXISTS idx_dogs_mother_id ON dogs(mother_id);

-- 完成！现在您可以在应用中添加繁殖记录了 