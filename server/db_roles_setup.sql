-- 권한 테이블 생성
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 권한 데이터 삽입
INSERT INTO roles (role_code, name, description) VALUES
('ADMIN', '관리자', '시스템 전체 관리 권한'),
('MANAGER', '매니저', '프로젝트 관리 권한'),
('DEVELOPER', '개발자', '개발 업무 권한'),
('MEMBER', '일반 사용자', '기본 사용자 권한')
ON CONFLICT (role_code) DO NOTHING;

-- 사용자 테이블에 role_code 컬럼 추가 (이미 있으면 무시)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_code VARCHAR(20) DEFAULT 'MEMBER';

-- 기존 사용자들의 role 컬럼 값을 role_code로 복사
UPDATE users 
SET role_code = 
    CASE 
        WHEN role = 'ADMIN' THEN 'ADMIN'
        WHEN role = 'MANAGER' THEN 'MANAGER'
        WHEN role = 'DEVELOPER' THEN 'DEVELOPER'
        ELSE 'MEMBER'
    END
WHERE role_code IS NULL OR role_code = '';

-- role_code에 외래키 제약 조건 추가
ALTER TABLE users 
ADD CONSTRAINT fk_users_role_code 
FOREIGN KEY (role_code) REFERENCES roles(role_code) 
ON DELETE SET DEFAULT; 