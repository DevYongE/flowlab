import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

export const getNotices = async (req: Request, res: Response) => {
  try {
    const notices = await sequelize.query(
      `SELECT n.*, u.name as author_name 
       FROM notices n 
       LEFT JOIN users u ON n.author_id = u.id 
       ORDER BY n.is_pinned DESC, n.created_at DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(notices);
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
    const [results] = await sequelize.query(
      `SELECT n.*, u.name as author_name 
       FROM notices n 
       LEFT JOIN users u ON n.author_id = u.id 
       WHERE n.notice_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    ) as [any[], any];
    let notice: any = undefined;
    if (Array.isArray(results) && results.length > 0) {
      notice = results[0];
    }
    if (!notice) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    res.json(notice);
  } catch (err) {
    res.status(500).json({ message: '공지사항 조회 실패', error: err });
  }
};

export const getLatestNotices = async (req: Request, res: Response) => {
  try {
    const notices = await sequelize.query(
      `SELECT notice_id, title, TO_CHAR(created_at, 'YYYY-MM-DD') as "createdAt" 
       FROM notices 
       ORDER BY is_pinned DESC, created_at DESC 
       LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    res.json(notices);
  } catch (err) {
    res.status(500).json({ message: '최신 공지사항 조회 실패', error: err });
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { title, content, author_id, is_pinned, notice_type, attachments } = req.body;
    const result = await sequelize.query(
      `INSERT INTO notices (title, content, author_id, is_pinned, notice_type, attachments) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      {
        replacements: [title, content, author_id, is_pinned ?? false, notice_type ?? 'general', attachments],
        type: QueryTypes.INSERT,
      }
    );
    res.status(201).json(result[0][0]);
  } catch (err) {
    res.status(500).json({ message: '공지사항 생성 실패', error: err });
  }
};

export const updateNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned, notice_type, attachments } = req.body;
    const result = await sequelize.query(
      `UPDATE notices SET title=$1, content=$2, is_pinned=$3, notice_type=$4, attachments=$5 WHERE notice_id=$6 RETURNING *`,
      {
        replacements: [title, content, is_pinned, notice_type, attachments, id],
        type: QueryTypes.UPDATE,
      }
    );
    if (result[0].length === 0) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    res.json(result[0][0]);
  } catch (err) {
    res.status(500).json({ message: '공지사항 수정 실패', error: err });
  }
};

export const deleteNotice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [deletedRows] = await sequelize.query('DELETE FROM notices WHERE notice_id = :id RETURNING *', {
      replacements: { id },
      type: QueryTypes.DELETE,
    }) as [any[], any];
    let deletedRow: any = undefined;
    if (Array.isArray(deletedRows) && deletedRows.length > 0) {
      deletedRow = deletedRows[0];
    }
    if (!deletedRow) {
      res.status(404).json({ message: '공지사항 없음' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: '공지사항 삭제 실패', error: err });
  }
}; 