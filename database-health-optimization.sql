-- 健康记录模块数据库优化脚本
-- 执行此脚本以优化健康记录查询性能

-- 为 health_records 表添加性能优化索引
CREATE INDEX IF NOT EXISTS idx_health_records_dog_id ON health_records(dog_id);
CREATE INDEX IF NOT EXISTS idx_health_records_type ON health_records(type);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_dog_type ON health_records(dog_id, type);
CREATE INDEX IF NOT EXISTS idx_health_records_dog_date ON health_records(dog_id, date DESC);

-- 创建健康记录汇总视图
CREATE OR REPLACE VIEW health_summary AS
SELECT 
    d.id as dog_id,
    d.name as dog_name,
    d.breed,
    d.gender,
    d.birth_date,
    d.status,
    COUNT(hr.id) as total_records,
    COUNT(CASE WHEN hr.type = 'vaccination' THEN 1 END) as vaccination_count,
    COUNT(CASE WHEN hr.type = 'checkup' THEN 1 END) as checkup_count,
    COUNT(CASE WHEN hr.type = 'treatment' THEN 1 END) as treatment_count,
    MAX(CASE WHEN hr.type = 'vaccination' THEN hr.date END) as last_vaccination,
    MAX(CASE WHEN hr.type = 'checkup' THEN hr.date END) as last_checkup,
    MAX(CASE WHEN hr.type = 'treatment' THEN hr.date END) as last_treatment,
    MAX(hr.date) as last_health_record
FROM dogs d
LEFT JOIN health_records hr ON d.id = hr.dog_id
GROUP BY d.id, d.name, d.breed, d.gender, d.birth_date, d.status;

-- 确保 RLS 策略正确设置
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view their own health records"
ON health_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health records"
ON health_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health records"
ON health_records FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health records"
ON health_records FOR DELETE
USING (auth.uid() = user_id);

-- 分析表以更新统计信息
ANALYZE health_records;
ANALYZE dogs; 