-- 프로젝트 할당 테이블에 역할 컬럼 추가
ALTER TABLE project_assignees 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'MEMBER';

-- 요구사항 할당 테이블에 역할 컬럼 추가  
ALTER TABLE devnote_assignees 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'DEVELOPER';

-- 프로젝트 할당 테이블의 기존 데이터에 기본 역할 설정
UPDATE project_assignees 
SET role = 'MEMBER' 
WHERE role IS NULL;

-- 요구사항 할당 테이블의 기존 데이터에 기본 역할 설정
UPDATE devnote_assignees 
SET role = 'DEVELOPER' 
WHERE role IS NULL;

-- 역할 제약 조건 추가 (프로젝트 할당)
ALTER TABLE project_assignees 
ADD CONSTRAINT check_project_role 
CHECK (role IN ('PL', 'PLANNER', 'DESIGNER', 'DEVELOPER', 'MEMBER'));

-- 역할 제약 조건 추가 (요구사항 할당)
ALTER TABLE devnote_assignees 
ADD CONSTRAINT check_devnote_role 
CHECK (role IN ('PL', 'PLANNER', 'DESIGNER', 'DEVELOPER'));

-- 프로젝트별 PL은 한 명만 가능하도록 제약 조건 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_pl_unique 
ON project_assignees (project_id) 
WHERE role = 'PL';

-- 요구사항별 각 역할은 한 명만 가능하도록 제약 조건 추가
CREATE UNIQUE INDEX IF NOT EXISTS idx_devnote_role_unique 
ON devnote_assignees (devnote_id, role); 