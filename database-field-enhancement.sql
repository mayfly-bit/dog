-- 为dogs表添加额外字段
-- 这个脚本是可选的，如果您希望支持更多狗狗信息字段

ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS color VARCHAR(50),
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS microchip_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS owner_contact VARCHAR(200),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 为新字段添加索引（可选，提高查询性能）
CREATE INDEX IF NOT EXISTS idx_dogs_microchip ON dogs(microchip_id);
CREATE INDEX IF NOT EXISTS idx_dogs_registration ON dogs(registration_number);

-- 添加注释
COMMENT ON COLUMN dogs.color IS '狗狗颜色';
COMMENT ON COLUMN dogs.weight IS '体重(公斤)';
COMMENT ON COLUMN dogs.microchip_id IS '芯片号';
COMMENT ON COLUMN dogs.registration_number IS '注册号';
COMMENT ON COLUMN dogs.owner_contact IS '主人联系方式';
COMMENT ON COLUMN dogs.notes IS '备注信息'; 