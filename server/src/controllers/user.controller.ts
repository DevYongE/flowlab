// server/controllers/user.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';

// 사용자 전체 조회
export const getUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ 사용자 조회 에러:', err);
    res.status(500).json({ message: '사용자 조회 실패', error: err });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      id,
      password,
      email,
      birth,
      name,
      position_code,
      department,
      join_date
    } = req.body;

    if (!join_date) {
      res.status(400).json({ message: '입사일자가 필요합니다.' });
      return;
    }

    const prefix = join_date.replace('-', '').slice(2); // '2025-06' => '2506'

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM users WHERE user_code LIKE $1',
      [`${prefix}%`]
    );

    const user_code = `${prefix}${String(Number(countRes.rows[0].count) + 1).padStart(2, '0')}`;
    const hashed = await bcrypt.hash(password, 10);
    const role_code = 'BASIC';

    await pool.query(
      `INSERT INTO users (
        id, password, email, birth, name, position_code, department, join_date, user_code, role_code
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, hashed, email, birth, name, position_code, department, join_date, user_code, role_code]
    );

    res.status(201).json({ message: '회원가입 완료', user_code });
  } catch (err) {
    console.error('❌ 회원가입 에러:', err);
    res.status(500).json({ message: '서버 오류', error: err });
  }
};
