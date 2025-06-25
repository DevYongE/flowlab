// server/controllers/position.controller.ts
import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

export const getAllPositions = async (req: Request, res: Response) => {
  try {
    const positions = await sequelize.query('SELECT * FROM positions order by id', { type: QueryTypes.SELECT });
    res.json(positions);
  } catch (err) {
    res.status(500).json({ message: '직책 목록 조회 실패', error: err });
  }
};

export const createPosition = async (req: Request, res: Response) => {
  const { code, name, company_code, company_name } = req.body;
  try {
    await sequelize.query('INSERT INTO positions (id, name, company_code, company_name) VALUES (:code, :name, :company_code, :company_name)', {
      replacements: { code, name, company_code, company_name },
      type: QueryTypes.INSERT,
    });
    res.status(201).json({ message: '직책 생성 완료' });
  } catch (err) {
    res.status(500).json({ message: '직책 생성 실패', error: err });
  }
};

export const updatePosition = async (req: Request, res: Response) => {
  const { code } = req.params;
  const { name, company_code, company_name } = req.body;
  try {
    await sequelize.query('UPDATE positions SET name = :name, company_code = :company_code, company_name = :company_name WHERE id = :code', {
      replacements: { code, name, company_code, company_name },
      type: QueryTypes.UPDATE,
    });
    res.json({ message: '직책 수정 완료' });
  } catch (err) {
    res.status(500).json({ message: '직책 수정 실패', error: err });
  }
};

export const deletePosition = async (req: Request, res: Response) => {
  const { code } = req.params;
  try {
    const [result]: any = await sequelize.query('DELETE FROM positions WHERE id = :code RETURNING *', {
      replacements: { code },
      type: QueryTypes.DELETE,
    });
    if (!result) {
      res.status(404).json({ message: '직책 없음' });
      return;
    }
    res.json({ message: '직책 삭제 완료' });
  } catch (err) {
    res.status(500).json({ message: '직책 삭제 실패', error: err });
  }
};
