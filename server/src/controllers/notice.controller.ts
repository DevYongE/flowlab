import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

export const getNotices = async (req: Request, res: Response) => {
  try {
    console.log('[공지 목록] 요청');
    const rows = await sequelize.query(
      `SELECT n.*, u.name as author_name 
       FROM notices n 
       LEFT JOIN users u ON n.author_id = u.id 
       ORDER BY n.is_pinned DESC, n.created_at DESC`,
      { type: QueryTypes.SELECT }
    ) as any[];
    console.log('[공지 목록] 결과:', rows.length);
    res.json(rows);
  } catch (err: any) {
    console.error('[공지 목록] 에러:', err);
    res.status(500).json({ message: '공지사항 조회 실패', error: err?.message, stack: err?.stack });
  }
};

export const getNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('[공지 상세] 요청 id:', id);
    // 조회수 증가
    await sequelize.query('UPDATE notices SET views = views + 1 WHERE notice_id = :id', {
      replacements: { id },
      type: QueryTypes.UPDATE,
    });
    // 공지사항 조회 (작성자 이름도 함께 가져오기)
    const rows = await sequelize.query(
      `SELECT n.*, u.name as author_name 
       FROM notices n 
       LEFT JOIN users u ON n.author_id = u.id 
       WHERE n.notice_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    ) as any[];
    console.log('[공지 상세] 결과:', rows);
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    const notice = rows[0];
    res.json(notice);
  } catch (err: any) {
    console.error('[공지 상세] 에러:', err);
    res.status(500).json({ message: '공지사항 조회 실패', error: err?.message, stack: err?.stack });
  }
};

export const getLatestNotices = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    console.log('📢 [getLatestNotices] 요청 - 사용자:', currentUserId, '권한:', currentUserRole);
    
    const rows = await sequelize.query(
      `SELECT notice_id, title, TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt", created_at, is_pinned 
       FROM notices 
       ORDER BY is_pinned DESC, created_at DESC 
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    ) as any[];
    
    console.log('📢 [getLatestNotices] 결과 개수:', rows.length);
    console.log('📢 [getLatestNotices] 결과:', rows);
    
    res.json(rows);
  } catch (err: any) {
    console.error('📢 [getLatestNotices] 에러:', err);
    res.status(500).json({ message: '최신 공지사항 조회 실패', error: err?.message, stack: err?.stack });
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, content, author_id, is_pinned, notice_type, attachments } = req.body;
    console.log('[공지 생성] 요청 데이터:', req.body);
    const safeAttachments =
      attachments === undefined || attachments === null || attachments === ''
        ? '[]'
        : typeof attachments === 'string'
          ? attachments
          : JSON.stringify(attachments);
    console.log('[공지 생성] 쿼리 실행 전');
    const [rows] = await sequelize.query(
      `INSERT INTO notices (title, content, author_id, is_pinned, notice_type, attachments) VALUES (:title, :content, :author_id, :is_pinned, :notice_type, :attachments) RETURNING *`,
      {
        replacements: { title, content, author_id, is_pinned: is_pinned ?? false, notice_type: notice_type ?? 'general', attachments: safeAttachments },
        type: QueryTypes.INSERT,
      }
    );
    console.log('[공지 생성] 쿼리 성공:', rows);
    res.status(201).json(Array.isArray(rows) ? rows[0] : undefined);
  } catch (err: any) {
    console.error('[공지 생성] 에러:', err);
    res.status(500).json({ message: '공지사항 생성 실패', error: err?.message, stack: err?.stack });
  }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned, notice_type, attachments } = req.body;
    console.log('[공지 수정] 요청 id:', id, 'body:', req.body);
    const safeAttachments =
      attachments === undefined || attachments === null || attachments === ''
        ? '[]'
        : typeof attachments === 'string'
          ? attachments
          : JSON.stringify(attachments);
    const result = await sequelize.query(
      `UPDATE notices SET title=:title, content=:content, is_pinned=:is_pinned, notice_type=:notice_type, attachments=:attachments WHERE notice_id=:id RETURNING *`,
      {
        replacements: { title, content, is_pinned, notice_type, attachments: safeAttachments, id },
        type: QueryTypes.UPDATE,
      }
    ) as any;
    const rows = Array.isArray(result[0]) ? result[0] : [];
    console.log('[공지 수정] 결과:', rows);
    if (rows.length === 0) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    res.json(rows[0]);
  } catch (err: any) {
    console.error('[공지 수정] 에러:', err);
    res.status(500).json({ message: '공지사항 수정 실패', error: err?.message, stack: err?.stack });
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    
    console.log('[공지 삭제] 요청 id:', id, '사용자:', currentUser?.id, '역할:', currentUser?.role);
    
    // 먼저 해당 공지사항이 존재하는지 확인
    const existingNotice = await sequelize.query(
      'SELECT notice_id FROM notices WHERE notice_id = :id',
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      }
    ) as any[];
    
    if (!existingNotice || existingNotice.length === 0) {
      console.log('[공지 삭제] 공지사항을 찾을 수 없음:', id);
      res.status(404).json({ message: '삭제할 공지사항을 찾을 수 없습니다.' });
      return;
    }
    
    // 삭제 실행
    const deleteResult = await sequelize.query(
      'DELETE FROM notices WHERE notice_id = :id',
      {
        replacements: { id },
        type: QueryTypes.DELETE,
      }
    );
    
    console.log('[공지 삭제] 삭제 완료 - id:', id);
    res.json({ 
      success: true, 
      message: '공지사항이 성공적으로 삭제되었습니다.',
      deletedId: id 
    });
    
  } catch (err: any) {
    console.error('[공지 삭제] 에러:', err);
    res.status(500).json({ 
      message: '공지사항 삭제 실패', 
      error: err?.message, 
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined 
    });
  }
}; 