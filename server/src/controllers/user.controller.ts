// server/controllers/user.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

// 사용자 전체 조회
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { company_code } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, d.department_name, p.name AS position_name, 
             COALESCE(u.role_code, 'MEMBER') as role_code, 
             u.position_code, u.company_code,
             CASE 
               WHEN COALESCE(u.role_code, 'MEMBER') = 'ADMIN' THEN '관리자'
               WHEN COALESCE(u.role_code, 'MEMBER') = 'MANAGER' THEN '매니저'
               WHEN COALESCE(u.role_code, 'MEMBER') = 'DEVELOPER' THEN '개발자'
               ELSE '일반 사용자'
             END as role_name
      FROM users u
      LEFT JOIN departments d ON u.department = d.id
      LEFT JOIN positions p ON u.position_code = p.position_code
    `;
    const params: any = {};
    if (company_code) {
      query += ' WHERE u.company_code = :company_code';
      params.company_code = company_code;
    }
    const rows = await sequelize.query(query, { replacements: params, type: QueryTypes.SELECT });
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
    const role_code = 'MEMBER'; // 기본 역할을 MEMBER로 설정

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
          role_code, // role_code 컬럼에 저장
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
      res.status(400).json({ message: '이름과 이메일은 필수 입력 항목입니다.' });
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

    // company_code 유효성 체크
    if (company_code !== undefined && company_code !== null && company_code !== '') {
      const companies: any = await sequelize.query(
        'SELECT company_code FROM companies WHERE company_code = :company_code',
        { replacements: { company_code }, type: QueryTypes.SELECT }
      );
      if (!Array.isArray(companies) || companies.length === 0) {
        res.status(400).json({ message: `존재하지 않는 기업 코드입니다: ${company_code}` });
        return;
      }
    }

    // department 유효성 체크 (departments.id 기준)
    if (department !== undefined && department !== null && department !== '') {
      const departments: any = await sequelize.query(
        'SELECT id FROM departments WHERE id = :department',
        { replacements: { department }, type: QueryTypes.SELECT }
      );
      if (!Array.isArray(departments) || departments.length === 0) {
        res.status(400).json({ message: `존재하지 않는 부서 id입니다: ${department}` });
        return;
      }
    }

    // 기존 사용자 확인
    const [existingUser]: any = await sequelize.query(
      'SELECT * FROM users WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!existingUser) {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
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
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.id;

    console.log('🔑 [updateUserRole] 권한 변경 요청:', { 
      targetUserId: id, 
      newRole: role_code, 
      currentUserRole, 
      currentUserId 
    });

    // 관리자 권한 체크
    if (currentUserRole !== 'ADMIN') {
      res.status(403).json({ message: '권한 변경은 관리자만 가능합니다.' });
      return;
    }

    // 필수 필드 검증
    if (!role_code) {
      res.status(400).json({ message: '변경할 권한 코드가 필요합니다.' });
      return;
    }

    // 대상 사용자 존재 확인
    const [targetUser]: any = await sequelize.query(
      'SELECT id, role_code FROM users WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!targetUser) {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      return;
    }

    // 권한 코드 유효성 체크 (하드코딩된 값으로 검증)
    const validRoleCodes = ['ADMIN', 'MANAGER', 'DEVELOPER', 'MEMBER'];
    
    if (!validRoleCodes.includes(role_code)) {
      res.status(400).json({ message: `유효하지 않은 권한 코드입니다: ${role_code}` });
      return;
    }

    // 자기 자신의 권한은 변경할 수 없음
    if (currentUserId === id) {
      res.status(400).json({ message: '자신의 권한은 변경할 수 없습니다.' });
      return;
    }

    // 권한 변경 실행 (트랜잭션 사용하여 안전하게 처리)
    await sequelize.query('BEGIN');
    try {
      const result = await sequelize.query(
        `UPDATE users SET role_code=:role_code WHERE id=:id`,
        {
          replacements: { role_code, id },
          type: QueryTypes.UPDATE,
        }
      );
      await sequelize.query('COMMIT');
    } catch (error) {
      await sequelize.query('ROLLBACK');
      throw error;
    }

    console.log('✅ [updateUserRole] 권한 변경 완료:', { 
      targetUserId: id, 
      oldRole: targetUser.role_code, 
      newRole: role_code 
    });

    res.status(200).json({ message: '권한이 변경되었습니다.' });
    return;
  } catch (err) {
    console.error('❌ [updateUserRole] 권한 변경 실패:', err);
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
