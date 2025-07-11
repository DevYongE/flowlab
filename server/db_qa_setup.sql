-- QA게시판 데이터베이스 스키마

-- QA 질문 테이블
CREATE TABLE IF NOT EXISTS qa_questions (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- TECH, SCHEDULE, REQUIREMENT, GENERAL
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- HIGH, NORMAL, LOW
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    tags TEXT[], -- PostgreSQL 배열 타입으로 태그 저장
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    accepted_answer_id INT DEFAULT NULL, -- 채택된 답변 ID
    view_count INT DEFAULT 0,
    vote_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA 답변 테이블
CREATE TABLE IF NOT EXISTS qa_answers (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES qa_questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    is_accepted BOOLEAN DEFAULT FALSE,
    vote_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA 답변 댓글 테이블
CREATE TABLE IF NOT EXISTS qa_answer_comments (
    id SERIAL PRIMARY KEY,
    answer_id INT REFERENCES qa_answers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA 투표 테이블 (질문과 답변에 대한 좋아요/싫어요)
CREATE TABLE IF NOT EXISTS qa_votes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    question_id INT REFERENCES qa_questions(id) ON DELETE CASCADE,
    answer_id INT REFERENCES qa_answers(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('UP', 'DOWN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id, answer_id) -- 한 사용자가 같은 질문/답변에 중복 투표 방지
);

-- QA 관심 질문 테이블 (북마크)
CREATE TABLE IF NOT EXISTS qa_bookmarks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    question_id INT REFERENCES qa_questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- QA 파일 첨부 테이블
CREATE TABLE IF NOT EXISTS qa_attachments (
    id SERIAL PRIMARY KEY,
    question_id INT REFERENCES qa_questions(id) ON DELETE CASCADE,
    answer_id INT REFERENCES qa_answers(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    content_type VARCHAR(100),
    uploaded_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (question_id IS NOT NULL OR answer_id IS NOT NULL) -- 질문 또는 답변 중 하나는 필수
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_qa_questions_project_id ON qa_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_author_id ON qa_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_status ON qa_questions(status);
CREATE INDEX IF NOT EXISTS idx_qa_questions_category ON qa_questions(category);
CREATE INDEX IF NOT EXISTS idx_qa_questions_created_at ON qa_questions(created_at);
CREATE INDEX IF NOT EXISTS idx_qa_questions_tags ON qa_questions USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_qa_answers_question_id ON qa_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_answers_author_id ON qa_answers(author_id);
CREATE INDEX IF NOT EXISTS idx_qa_answers_is_accepted ON qa_answers(is_accepted);

CREATE INDEX IF NOT EXISTS idx_qa_votes_user_id ON qa_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_votes_question_id ON qa_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_votes_answer_id ON qa_votes(answer_id);

-- 트리거 생성 (답변 채택 시 질문 상태 업데이트)
CREATE OR REPLACE FUNCTION update_question_status_on_answer_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_accepted = TRUE AND OLD.is_accepted = FALSE THEN
        -- 답변이 채택되면 질문 상태를 RESOLVED로 변경
        UPDATE qa_questions 
        SET status = 'RESOLVED', 
            accepted_answer_id = NEW.id,
            updated_at = NOW()
        WHERE id = NEW.question_id;
        
        -- 다른 답변들의 채택 상태를 FALSE로 변경
        UPDATE qa_answers 
        SET is_accepted = FALSE 
        WHERE question_id = NEW.question_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_status_on_answer_accepted
    AFTER UPDATE ON qa_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_question_status_on_answer_accepted();

-- 투표 카운트 업데이트 트리거
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 질문에 대한 투표
        IF NEW.question_id IS NOT NULL THEN
            UPDATE qa_questions 
            SET vote_count = vote_count + CASE WHEN NEW.vote_type = 'UP' THEN 1 ELSE -1 END
            WHERE id = NEW.question_id;
        END IF;
        
        -- 답변에 대한 투표
        IF NEW.answer_id IS NOT NULL THEN
            UPDATE qa_answers 
            SET vote_count = vote_count + CASE WHEN NEW.vote_type = 'UP' THEN 1 ELSE -1 END
            WHERE id = NEW.answer_id;
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- 질문에 대한 투표 삭제
        IF OLD.question_id IS NOT NULL THEN
            UPDATE qa_questions 
            SET vote_count = vote_count - CASE WHEN OLD.vote_type = 'UP' THEN 1 ELSE -1 END
            WHERE id = OLD.question_id;
        END IF;
        
        -- 답변에 대한 투표 삭제
        IF OLD.answer_id IS NOT NULL THEN
            UPDATE qa_answers 
            SET vote_count = vote_count - CASE WHEN OLD.vote_type = 'UP' THEN 1 ELSE -1 END
            WHERE id = OLD.answer_id;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_count
    AFTER INSERT OR DELETE ON qa_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_count(); 