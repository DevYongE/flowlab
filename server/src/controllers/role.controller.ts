import { Request, Response } from 'express';
import pool from '../config/db';

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM roles order by id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '권한 목록 조회 실패', error: err });
  }
}; 