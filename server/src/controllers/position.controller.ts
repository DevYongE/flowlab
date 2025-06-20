// server/controllers/position.controller.ts
import { Request, Response } from 'express';
import pool from '../config/db';

export const getAllPositions = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM positions order by id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '직책 목록 조회 실패', error: err });
  }
};

export const createPosition = async (req: Request, res: Response) => {
  const { code, name } = req.body;
  try {
    await pool.query('INSERT INTO positions (id, name) VALUES ($1, $2)', [code, name]);
    res.status(201).json({ message: '직책 생성 완료' });
  } catch (err) {
    res.status(500).json({ message: '직책 생성 실패', error: err });
  }
};

export const updatePosition = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { name } = req.body;
  try {
    await pool.query('UPDATE positions SET name = $1 WHERE id = $2', [name, code]);
    res.json({ message: '직책 수정 완료' });
  } catch (err) {
    res.status(500).json({ message: '직책 수정 실패', error: err });
  }
};

export const deletePosition = async (req: Request, res: Response) => {
  const { code } = req.params;
  try {
    await pool.query('DELETE FROM positions WHERE id = $1', [code]);
    res.json({ message: '직책 삭제 완료' });
  } catch (err) {
    res.status(500).json({ message: '직책 삭제 실패', error: err });
  }
};
