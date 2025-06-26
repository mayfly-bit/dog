-- 创建dog-photos存储桶的权限策略
-- 请在Supabase SQL Editor中执行此脚本

-- 1. 插入存储桶访问策略 - 允许认证用户上传文件
INSERT INTO storage.policies (id, bucket_id, type, name, definition, check_definition, command)
VALUES (
  'dog-photos-upload-policy',
  'dog-photos',
  'object',
  'Users can upload dog photos',
  '(bucket_id = ''dog-photos''::text) AND (auth.role() = ''authenticated''::text)',
  '(bucket_id = ''dog-photos''::text) AND (auth.role() = ''authenticated''::text)',
  'INSERT'
) ON CONFLICT (id) DO NOTHING;

-- 2. 插入存储桶读取策略 - 允许公开访问
INSERT INTO storage.policies (id, bucket_id, type, name, definition, check_definition, command)
VALUES (
  'dog-photos-read-policy',
  'dog-photos',
  'object',
  'Anyone can view dog photos',
  '(bucket_id = ''dog-photos''::text)',
  '(bucket_id = ''dog-photos''::text)',
  'SELECT'
) ON CONFLICT (id) DO NOTHING;

-- 3. 插入存储桶更新策略 - 允许认证用户更新自己上传的文件
INSERT INTO storage.policies (id, bucket_id, type, name, definition, check_definition, command)
VALUES (
  'dog-photos-update-policy',
  'dog-photos',
  'object',
  'Users can update their dog photos',
  '(bucket_id = ''dog-photos''::text) AND (auth.role() = ''authenticated''::text)',
  '(bucket_id = ''dog-photos''::text) AND (auth.role() = ''authenticated''::text)',
  'UPDATE'
) ON CONFLICT (id) DO NOTHING;

-- 4. 插入存储桶删除策略 - 允许认证用户删除自己上传的文件
INSERT INTO storage.policies (id, bucket_id, type, name, definition, check_definition, command)
VALUES (
  'dog-photos-delete-policy',
  'dog-photos',
  'object',
  'Users can delete their dog photos',
  '(bucket_id = ''dog-photos''::text) AND (auth.role() = ''authenticated''::text)',
  '(bucket_id = ''dog-photos''::text) AND (auth.role() = ''authenticated''::text)',
  'DELETE'
) ON CONFLICT (id) DO NOTHING; 