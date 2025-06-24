import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await sequelize.query('SELECT * FROM roles order by id', { type: QueryTypes.SELECT });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ message: '권한 목록 조회 실패', error: err });
  }
}; 