-- 繁殖管理数据库修复脚本
-- 修复 litters 表的外键关系和字段

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

-- 8. 添加一些示例繁殖数据（可选）
-- 注意：只有在有足够的狗狗数据时才会插入示例记录
INSERT INTO litters (user_id, mother_id, father_id, mating_date, expected_birth_date, notes) 
SELECT 
    auth.uid(),
    female_dog.id,
    male_dog.id,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '33 days',
    '示例配种记录'
FROM 
    (SELECT id FROM dogs WHERE gender = 'female' LIMIT 1) AS female_dog,
    (SELECT id FROM dogs WHERE gender = 'male' LIMIT 1) AS male_dog
WHERE 
    female_dog.id IS NOT NULL 
    AND male_dog.id IS NOT NULL
    AND auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING; 