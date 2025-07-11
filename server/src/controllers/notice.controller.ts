import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

export const getNotices = async (req: Request, res: Response) => {
  try {
    const rows = await sequelize.query(
      `SELECT n.*, u.name as author_name 
       FROM notices n 
       LEFT JOIN users u ON n.author_id = u.id 
       ORDER BY n.is_pinned DESC, n.created_at DESC`,
      { type: QueryTypes.SELECT }
    ) as any[];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '공지사항 조회 실패', error: err });
  }
};

export const getNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 조회수 증가
    await sequelize.query('UPDATE notices SET views = views + 1 WHERE notice_id = :id', {
      replacements: { id },
      type: QueryTypes.UPDATE,
    });
    // 공지사항 조회 (작성자 이름도 함께 가져오기)
    const [rows] = await sequelize.query(
      `SELECT n.*, u.name as author_name 
       FROM notices n 
       LEFT JOIN users u ON n.author_id = u.id 
       WHERE n.notice_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    const notice = Array.isArray(rows) ? rows[0] : undefined;
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: '공지사항 조회 실패', error: err });
  }
};

export const getLatestNotices = async (req: Request, res: Response) => {
  try {
    const rows = await sequelize.query(
      `SELECT notice_id, title, TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt" 
       FROM notices 
       ORDER BY is_pinned DESC, created_at DESC 
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    ) as any[];
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '최신 공지사항 조회 실패', error: err });
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, content, author_id, is_pinned, notice_type, attachments } = req.body;
    console.log('[공지 생성] 요청 데이터:', req.body);
    const safeAttachments = attachments === undefined || attachments === null ? '' : attachments;
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
    const result = await sequelize.query(
      `UPDATE notices SET title=:title, content=:content, is_pinned=:is_pinned, notice_type=:notice_type, attachments=:attachments WHERE notice_id=:id RETURNING *`,
      {
        replacements: { title, content, is_pinned, notice_type, attachments, id },
        type: QueryTypes.UPDATE,
      }
    ) as any;
    const rows = Array.isArray(result[0]) ? result[0] : [];
    if (rows.length === 0) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: '공지사항 수정 실패', error: err });
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await sequelize.query('DELETE FROM notices WHERE notice_id = :id RETURNING *', {
      replacements: { id },
      type: QueryTypes.DELETE,
    }) as any;
    const rows = Array.isArray(result[0]) ? result[0] : [];
    if (rows.length === 0) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: '공지사항 삭제 실패', error: err });
  }
}; 