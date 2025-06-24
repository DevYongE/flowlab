import { Request, Response } from 'express';
import Company from '../models/company.model';
import { Model } from 'sequelize';

const CompanyModel = Company as typeof Model & typeof Company;

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await CompanyModel.findAll();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const company = await CompanyModel.findByPk(req.params.id);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    // 1. 가장 최근 company_code 조회
    const lastCompany = await CompanyModel.findOne({
      order: [['company_code', 'DESC']],
      attributes: ['company_code'],
    });
    let nextCodeNum = 1;
    if (lastCompany && lastCompany.get('company_code')) {
      const lastCode = String(lastCompany.get('company_code'));
      // 숫자만 추출 (앞에 0이 있을 수 있음)
      const num = parseInt(lastCode.replace(/\D/g, ''), 10);
      if (!isNaN(num)) nextCodeNum = num + 1;
    }
    // 2. 5자리 문자열로 변환 (앞에 0 채움)
    const nextCompanyCode = String(nextCodeNum).padStart(5, '0');
    // 3. company_code를 req.body에 강제로 세팅
    const companyData = { ...req.body, company_code: nextCompanyCode };
    const company = await CompanyModel.create(companyData);
    res.status(201).json(company);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create company' });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const company = await CompanyModel.findByPk(req.params.id);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    await company.update(req.body);
    res.json(company);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update company' });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const company = await CompanyModel.findByPk(req.params.id);
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    await company.destroy();
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete company' });
  }
}; 