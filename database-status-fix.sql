-- 修复狗狗状态约束脚本
-- 将 'available' 状态改为 'for_sale'

DO $$
BEGIN
    -- 首先更新现有数据：将 'available' 状态改为 'for_sale'
    UPDATE dogs SET status = 'for_sale' WHERE status = 'available';
    
    -- 删除旧的状态约束
    ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_status_check;
    
    -- 添加新的状态约束，包含 'for_sale' 而不是 'available'
    ALTER TABLE dogs ADD CONSTRAINT dogs_status_check 
        CHECK (status IN ('owned', 'for_sale', 'sold', 'deceased', 'returned'));
        
    RAISE NOTICE '狗狗状态约束已更新，现在支持: owned, for_sale, sold, deceased, returned';
END $$; 