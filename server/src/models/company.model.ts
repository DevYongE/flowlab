import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface CompanyAttributes {
  company_id: string;
  company_name: string;
  company_code: string;
  company_info?: string;
  company_type?: string;
  industry_type?: string;
  founded_at?: Date;
  registered_at?: Date;
  updated_at?: Date;
  is_active?: boolean;
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'company_id' | 'company_info' | 'company_type' | 'industry_type' | 'founded_at' | 'registered_at' | 'updated_at' | 'is_active'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public company_id!: string;
  public company_name!: string;
  public company_code!: string;
  public company_info?: string;
  public company_type?: string;
  public industry_type?: string;
  public founded_at?: Date;
  public registered_at?: Date;
  public updated_at?: Date;
  public is_active?: boolean;
}

Company.init(
  {
    company_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    company_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    company_info: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    company_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    industry_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    founded_at: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    registered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Company',
    tableName: 'companies',
    timestamps: false,
  }
);

export default Company; 