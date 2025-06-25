import { Request, Response } from 'express';
import Department from '../models/department.model';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

// id 자동생성: company_code + 4자리
async function generateDepartmentId(company_code: string): Promise<string> {
  const [row]: any = await sequelize.query(
    'SELECT id FROM departments WHERE company_code = :company_code ORDER BY id DESC LIMIT 1',
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

// POST /api/departments
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department_name, company_code, description, is_active } = req.body;
    if (!department_name || !company_code) {
      res.status(400).json({ message: '필수값 누락' });
      return;
    }
    const id = await generateDepartmentId(company_code);
    const registered_by = req.user?.id;
    const department = await Department.create({
      id,
      department_name,
      company_code,
      description,
      is_active,
      registered_by,
    });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: '부서 등록 실패', error });
  }
};

// GET /api/departments?company_code=XXX
export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    let { company_code } = req.query;
    let where = undefined;
    if (company_code) {
      if (Array.isArray(company_code)) company_code = company_code[0];
      if (typeof company_code !== 'string') company_code = String(company_code);
      where = { company_code };
    }
    const departments = await Department.findAll({ where });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: '부서 목록 조회 실패', error });
  }
};

// GET /api/departments/:id
export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) {
      res.status(404).json({ message: '부서를 찾을 수 없습니다.' });
      return;
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: '부서 상세 조회 실패', error });
  }
};

// PUT /api/departments/:id
export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { department_name, description, is_active } = req.body;
    const department = await Department.findByPk(id);
    if (!department) {
      res.status(404).json({ message: '부서를 찾을 수 없습니다.' });
      return;
    }
    department.department_name = department_name ?? department.department_name;
    department.description = description ?? department.description;
    department.is_active = is_active ?? department.is_active;
    department.updated_at = new Date();
    await department.save();
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: '부서 수정 실패', error });
  }
}; 