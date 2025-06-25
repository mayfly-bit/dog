-- 成长档案数据库表结构
-- 为狗狗成长记录创建相关表

-- 1. 成长记录表 (growth_records)
CREATE TABLE IF NOT EXISTS growth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    weight DECIMAL(5,2), -- 体重（公斤）
    height DECIMAL(5,2), -- 身高（厘米）
    length DECIMAL(5,2), -- 体长（厘米）
    chest_girth DECIMAL(5,2), -- 胸围（厘米）
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 成长里程碑表 (growth_milestones)
CREATE TABLE IF NOT EXISTS growth_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    milestone_date DATE NOT NULL,
    milestone_type VARCHAR(50) NOT NULL, -- 里程碑类型：first_walk, first_solid_food, first_vaccination, etc.
    title VARCHAR(100) NOT NULL,
    description TEXT,
    photo_urls TEXT[], -- 照片URL数组
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 成长照片表 (growth_photos)
CREATE TABLE IF NOT EXISTS growth_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    photo_date DATE NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    age_in_days INTEGER, -- 照片拍摄时的年龄（天数）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 成长日志表 (growth_logs)
CREATE TABLE IF NOT EXISTS growth_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dog_id UUID NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    log_type VARCHAR(50) NOT NULL, -- 日志类型：behavior, training, health, general, etc.
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(20), -- 心情：happy, active, calm, tired, sick, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_growth_records_dog_id ON growth_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_growth_records_date ON growth_records(record_date);
CREATE INDEX IF NOT EXISTS idx_growth_milestones_dog_id ON growth_milestones(dog_id);
CREATE INDEX IF NOT EXISTS idx_growth_milestones_date ON growth_milestones(milestone_date);
CREATE INDEX IF NOT EXISTS idx_growth_photos_dog_id ON growth_photos(dog_id);
CREATE INDEX IF NOT EXISTS idx_growth_photos_date ON growth_photos(photo_date);
CREATE INDEX IF NOT EXISTS idx_growth_logs_dog_id ON growth_logs(dog_id);
CREATE INDEX IF NOT EXISTS idx_growth_logs_date ON growth_logs(log_date);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为各表添加更新时间触发器
DROP TRIGGER IF EXISTS update_growth_records_updated_at ON growth_records;
CREATE TRIGGER update_growth_records_updated_at 
    BEFORE UPDATE ON growth_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_growth_milestones_updated_at ON growth_milestones;
CREATE TRIGGER update_growth_milestones_updated_at 
    BEFORE UPDATE ON growth_milestones 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_growth_photos_updated_at ON growth_photos;
CREATE TRIGGER update_growth_photos_updated_at 
    BEFORE UPDATE ON growth_photos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_growth_logs_updated_at ON growth_logs;
CREATE TRIGGER update_growth_logs_updated_at 
    BEFORE UPDATE ON growth_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 设置行级安全策略 (RLS)
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_logs ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can manage their own growth records" ON growth_records;
DROP POLICY IF EXISTS "Users can manage their own growth milestones" ON growth_milestones;
DROP POLICY IF EXISTS "Users can manage their own growth photos" ON growth_photos;
DROP POLICY IF EXISTS "Users can manage their own growth logs" ON growth_logs;

-- growth_records 策略
CREATE POLICY "Users can manage their own growth records" ON growth_records
    FOR ALL USING (auth.uid() = user_id);

-- growth_milestones 策略
CREATE POLICY "Users can manage their own growth milestones" ON growth_milestones
    FOR ALL USING (auth.uid() = user_id);

-- growth_photos 策略
CREATE POLICY "Users can manage their own growth photos" ON growth_photos
    FOR ALL USING (auth.uid() = user_id);

-- growth_logs 策略
CREATE POLICY "Users can manage their own growth logs" ON growth_logs
    FOR ALL USING (auth.uid() = user_id);

-- 完成！成长档案表结构已创建 