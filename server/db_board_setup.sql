-- 자유게시판 테이블
CREATE TABLE IF NOT EXISTS board_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'free', -- free, info, question, etc.
    views INT DEFAULT 0,
    likes INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자유게시판 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES board_posts(id) ON DELETE CASCADE,
    author_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    parent_id INT REFERENCES board_comments(id) ON DELETE CASCADE NULL, -- 대댓글용
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 자유게시판 좋아요 테이블
CREATE TABLE IF NOT EXISTS board_likes (
    id SERIAL PRIMARY KEY,
    post_id INT REFERENCES board_posts(id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (post_id, user_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_board_posts_author ON board_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_category ON board_posts(category);
CREATE INDEX IF NOT EXISTS idx_board_posts_created_at ON board_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_board_comments_post_id ON board_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_parent_id ON board_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_board_likes_post_id ON board_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_board_likes_user_id ON board_likes(user_id); 