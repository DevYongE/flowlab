-- 프로젝트 기본 정보 테이블
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    os VARCHAR(100),
    memory VARCHAR(50),
    progress INT DEFAULT 0,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트 상세 정보 테이블 (SI, 센트릭 등)
CREATE TABLE IF NOT EXISTS project_details (
    id SERIAL PRIMARY KEY,
    project_id INT UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    java_version VARCHAR(50),
    spring_version VARCHAR(50),
    react_version VARCHAR(50),
    vue_version VARCHAR(50),
    tomcat_version VARCHAR(50),
    centric_version VARCHAR(50)
);

-- 개발 노트 (이슈) 테이블
CREATE TABLE IF NOT EXISTS dev_notes (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT '미결', -- 미결, 진행중, 완료
    progress INT DEFAULT 0,
    deadline DATE,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로젝트-회원 할당 테이블
CREATE TABLE IF NOT EXISTS project_assignees (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_id, user_id)
); 