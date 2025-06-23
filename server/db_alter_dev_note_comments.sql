-- dev_notes 테이블에 대한 코멘트를 저장할 테이블
CREATE TABLE dev_note_comments (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES dev_notes(id) ON DELETE CASCADE,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 예시 인덱스 (조회 성능 향상을 위해)
CREATE INDEX idx_dev_note_comments_note_id ON dev_note_comments(note_id);

COMMENT ON TABLE dev_note_comments IS '개발 노트(요구사항)에 대한 댓글';
COMMENT ON COLUMN dev_note_comments.id IS '댓글의 고유 ID';
COMMENT ON COLUMN dev_note_comments.note_id IS '관련된 개발 노트의 ID';
COMMENT ON COLUMN dev_note_comments.author_id IS '댓글 작성자의 ID';
COMMENT ON COLUMN dev_note_comments.content IS '댓글 내용';
COMMENT ON COLUMN dev_note_comments.created_at IS '댓글 작성 시간'; 