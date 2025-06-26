// server/controllers/user.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

// 사용자 전체 조회
export const getUsers = async (req: Request, res: Response) => {
  try {
    const rows = await sequelize.query(`
      SELECT u.*, 
             c.company_name,
             p.name AS position_name, 
             r.name AS role_name
      FROM users u
      LEFT JOIN companies c ON u.company_code = c.company_code
      LEFT JOIN positions p ON u.position_code = p.id::text
      LEFT JOIN roles r ON u.role_code = r.role_code
    `, { type: QueryTypes.SELECT });
    res.status(200).json(Array.isArray(rows) ? rows : []);
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
      join_date,
      company_code,
    } = req.body;

    if (!join_date) {
      res.status(400).json({ message: '입사일자가 필요합니다.' });
      return;
    }

    const prefix = join_date.replace('-', '').slice(2); // '2025-06' => '2506'

    const [countRes]: any = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE user_code LIKE :prefix',
      { replacements: { prefix: `${prefix}%` }, type: QueryTypes.SELECT }
    );

    const user_code = `${prefix}${String(Number(countRes.count) + 1).padStart(2, '0')}`;
    const hashed = await bcrypt.hash(password, 10);
    const role_code = 'BASIC';

    await sequelize.query(
      `INSERT INTO users (
        id, password, email, birth, name, position_code, department, join_date, user_code, role_code, company_code
      ) VALUES (:id,:password,:email,:birth,:name,:position_code,:department,:join_date,:user_code,:role_code,:company_code)`,
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
          company_code,
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
    const { name, email, department, position_code, company_code } = req.body;

    // 필수 필드 검증
    if (!name || !email) {
      res.status(400).json({ 
        message: '이름과 이메일은 필수 입력 항목입니다.' 
      });
      return;
    }

    // position_code 유효성 체크 (문자열 기준)
    if (position_code !== undefined && position_code !== null && position_code !== '') {
      const positions: any = await sequelize.query(
        'SELECT position_code FROM positions WHERE position_code = :position_code',
        { replacements: { position_code }, type: QueryTypes.SELECT }
      );
      if (!Array.isArray(positions) || positions.length === 0) {
        res.status(400).json({ message: `존재하지 않는 직급 코드입니다: ${position_code}` });
        return;
      }
    }

    // 기존 사용자 확인
    const [existingUser]: any = await sequelize.query(
      'SELECT * FROM users WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!existingUser) {
      res.status(404).json({ 
        message: '사용자를 찾을 수 없습니다.' 
      });
      return;
    }

    const replacements = {
      name,
      email,
      department: department || null,
      position_code: position_code || null,
      company_code: company_code || null,
      id,
    };

    await sequelize.query(
      `UPDATE users SET 
        name=:name, 
        email=:email, 
        department=:department, 
        position_code=:position_code,
        company_code=:company_code 
      WHERE id=:id`,
      {
        replacements,
        type: QueryTypes.UPDATE,
      }
    );
    res.status(200).json({ message: '회원 정보가 수정되었습니다.' });
    return;
  } catch (err) {
    console.error('❌ 회원 정보 수정 에러:', err);
    res.status(500).json({ message: '회원 정보 수정 실패', error: err });
    return;
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
    return;
  } catch (err) {
    res.status(500).json({ message: '회원 삭제 실패', error: err });
    return;
  }
};

// 권한 변경
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role_code } = req.body;
    await sequelize.query(
      `UPDATE users SET role_code=:role_code WHERE id=:id`,
      {
        replacements: { role_code, id },
        type: QueryTypes.UPDATE,
      }
    );
    res.status(200).json({ message: '권한이 변경되었습니다.' });
    return;
  } catch (err) {
    res.status(500).json({ message: '권한 변경 실패', error: err });
    return;
  }
};

// 부서 변경
export const updateUserDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { department } = req.body;
    await sequelize.query(
      `UPDATE users SET department=:department WHERE id=:id`,
      {
        replacements: { department, id },
        type: QueryTypes.UPDATE,
      }
    );
    res.status(200).json({ message: '부서가 변경되었습니다.' });
    return;
  } catch (err) {
    res.status(500).json({ message: '부서 변경 실패', error: err });
    return;
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
    return;
  } catch (err) {
    res.status(500).json({ message: '직급 변경 실패', error: err });
    return;
  }
};
