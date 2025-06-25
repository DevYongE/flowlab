import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface DepartmentAttributes {
  id: string;
  department_name: string;
  company_code: string;
  description?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  registered_by?: string;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'description' | 'is_active' | 'created_at' | 'updated_at' | 'registered_by'> {}

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: string;
  public department_name!: string;
  public company_code!: string;
  public description?: string;
  public is_active?: boolean;
  public created_at?: Date;
  public updated_at?: Date;
  public registered_by?: string;
}

Department.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
    },
    department_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    company_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    registered_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
    timestamps: false,
  }
);

export default Department; 