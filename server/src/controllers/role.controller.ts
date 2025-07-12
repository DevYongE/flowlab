import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    // 하드코딩된 권한 목록 반환
    const roles = [
      { id: 1, role_code: 'ADMIN', name: '관리자', description: '시스템 전체 관리 권한' },
      { id: 2, role_code: 'MANAGER', name: '매니저', description: '프로젝트 관리 권한' },
      { id: 3, role_code: 'DEVELOPER', name: '개발자', description: '개발 업무 권한' },
      { id: 4, role_code: 'MEMBER', name: '일반 사용자', description: '기본 사용자 권한' }
    ];
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: '권한 목록 조회 실패', error: err });
  }
}; 