-- 기존 외래키 제약 조건들 제거
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_role_code;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_code_fkey;

-- role_code 컬럼이 존재하지 않으면 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_code VARCHAR(20) DEFAULT 'MEMBER';

-- 기존 role_code 값이 null이거나 빈 값인 경우 기본값 설정
UPDATE users SET role_code = 'MEMBER' WHERE role_code IS NULL OR role_code = '';

-- 유효하지 않은 role_code 값들을 기본값으로 변경
UPDATE users SET role_code = 'MEMBER' WHERE role_code NOT IN ('ADMIN', 'MANAGER', 'DEVELOPER', 'MEMBER'); 