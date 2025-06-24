// server/controllers/user.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import sequelize, { QueryTypes } from '../config/db';

// 사용자 전체 조회
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await sequelize.query(`
      SELECT u.*, p.name AS position_name, r.name AS role_name
      FROM users u
      LEFT JOIN positions p ON u.position_code = p.position_code
      LEFT JOIN roles r ON u.role_code = r.role_code
    `, { type: QueryTypes.SELECT });
    res.status(200).json(users);
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

    const [countRes]: any = await sequelize.query(
      'SELECT COUNT(*) FROM users WHERE user_code LIKE :prefix',
      { replacements: { prefix: `${prefix}%` }, type: QueryTypes.SELECT }
    );

    const user_code = `${prefix}${String(Number(countRes.count) + 1).padStart(2, '0')}`;
    const hashed = await bcrypt.hash(password, 10);
    const role_code = 'BASIC';

    await sequelize.query(
      `INSERT INTO users (
        id, password, email, birth, name, position_code, department, join_date, user_code, role_code
      ) VALUES (:id,:password,:email,:birth,:name,:position_code,:department,:join_date,:user_code,:role_code)`,
      {
        replacements: {
          id,
          password: hashed,
          email,
          birth,
          name,
          position_code,
          department,
          join_date,
          user_code,
          role_code,
        },
        type: QueryTypes.INSERT,
      }
    );

    res.status(201).json({ message: '회원가입 완료', user_code });
  } catch (err) {
    console.error('❌ 회원가입 에러:', err);
    res.status(500).json({ message: '서버 오류', error: err });
  }
};

// 회원 정보 수정
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, department, position_code } = req.body;
    await sequelize.query(
      `UPDATE users SET name=$1, email=$2, department=$3, position_code=$4 WHERE id=$5`,
      [name, email, department, position_code, id]
    );
    res.status(200).json({ message: '회원 정보가 수정되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '회원 정보 수정 실패', error: err });
  }
};

// 회원 삭제
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await sequelize.query(`DELETE FROM users WHERE id=:id`, {
      replacements: { id },
      type: QueryTypes.DELETE,
    });
    res.status(200).json({ message: '회원이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '회원 삭제 실패', error: err });
  }
};

// 권한 변경
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role_code } = req.body;
    await sequelize.query(`UPDATE users SET role_code=$1 WHERE id=$2`, [role_code, id]);
    res.status(200).json({ message: '권한이 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '권한 변경 실패', error: err });
  }
};

// 부서 변경
export const updateUserDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { department } = req.body;
    await sequelize.query(`UPDATE users SET department=$1 WHERE id=$2`, [department, id]);
    res.status(200).json({ message: '부서가 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '부서 변경 실패', error: err });
  }
};

// 직급 변경
export const updateUserPosition = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { position_code } = req.body;
    await sequelize.query(`UPDATE users SET position_code=:position_code WHERE id=:id`, {
      replacements: { position_code, id },
      type: QueryTypes.UPDATE,
    });
    res.status(200).json({ message: '직급이 변경되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '직급 변경 실패', error: err });
  }
};
