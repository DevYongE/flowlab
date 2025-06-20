-- dev_notes 테이블 구조 변경 스크립트

-- 1. progress 컬럼 추가 (존재하지 않을 경우에만)
-- 진행률을 저장하며, 기본값은 0입니다.
ALTER TABLE dev_notes ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;

-- 2. author_id 컬럼 추가 (존재하지 않을 경우에만)
-- 작성자 ID를 저장합니다.
ALTER TABLE dev_notes ADD COLUMN IF NOT EXISTS author_id VARCHAR(255);

-- 3. author_id에 외래 키(Foreign Key) 제약 조건 추가
-- 이 제약 조건은 users 테이블의 id를 참조하며,
-- 연결된 사용자가 삭제될 경우 author_id를 NULL로 설정합니다.
-- 제약 조건 이름(dev_notes_author_id_fkey)이 이미 존재하는 경우 오류가 발생할 수 있으므로,
-- 실행 전 확인이 필요할 수 있습니다.
ALTER TABLE dev_notes
ADD CONSTRAINT dev_notes_author_id_fkey
FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL; 