import { Request, Response } from 'express';
import Company from '../models/company.model';

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch company' });
  }
};

export const createCompany = async (req: Request, res: Response) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create company' });
  }
};

export const updateCompany = async (req: Request, res: Response) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    await company.update(req.body);
    res.json(company);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update company' });
  }
};

export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    await company.destroy();
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete company' });
  }
}; 