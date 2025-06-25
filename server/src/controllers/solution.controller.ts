import { Request, Response } from 'express';
import Solution from '../models/solution.model';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

// id 자동생성: company_code + 4자리
async function generateSolutionId(company_code: string): Promise<string> {
  // 가장 큰 id를 찾아서 4자리 숫자 추출 후 +1
  const [row]: any = await sequelize.query(
    'SELECT id FROM solutions WHERE company_code = :company_code ORDER BY id DESC LIMIT 1',
    { replacements: { company_code }, type: QueryTypes.SELECT }
  );
  let nextNum = 1;
  if (row && row.id) {
    const match = row.id.match(/^(.*?)(\d{4})$/);
    if (match) {
      nextNum = parseInt(match[2], 10) + 1;
    }
  }
  return company_code + String(nextNum).padStart(4, '0');
}

// POST /api/solutions
export const createSolution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { solution_name, company_code, description, version, is_active } = req.body;
    if (!solution_name || !company_code) {
      res.status(400).json({ message: '필수값 누락' });
      return;
    }
    const id = await generateSolutionId(company_code);
    const registered_by = req.user?.id;
    const solution = await Solution.create({
      id,
      solution_name,
      company_code,
      description,
      version,
      is_active,
      registered_by,
    });
    res.status(201).json(solution);
  } catch (error) {
    res.status(500).json({ message: '솔루션 등록 실패', error });
  }
};

// GET /api/solutions?company_code=XXX
export const getSolutions = async (req: Request, res: Response): Promise<void> => {
  try {
    let { company_code } = req.query;
    let where = undefined;
    if (company_code) {
      if (Array.isArray(company_code)) company_code = company_code[0];
      if (typeof company_code !== 'string') company_code = String(company_code);
      where = { company_code };
    }
    const solutions = await Solution.findAll({ where });
    res.json(solutions);
  } catch (error) {
    res.status(500).json({ message: '솔루션 목록 조회 실패', error });
  }
};

// GET /api/solutions/:id
export const getSolutionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const solution = await Solution.findByPk(id);
    if (!solution) {
      res.status(404).json({ message: '솔루션을 찾을 수 없습니다.' });
      return;
    }
    res.json(solution);
  } catch (error) {
    res.status(500).json({ message: '솔루션 상세 조회 실패', error });
  }
}; 