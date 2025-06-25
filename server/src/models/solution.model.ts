import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface SolutionAttributes {
  id: string;
  solution_name: string;
  company_code: string;
  description?: string;
  version?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  registered_by?: string;
}

interface SolutionCreationAttributes extends Optional<SolutionAttributes, 'id' | 'description' | 'version' | 'is_active' | 'created_at' | 'updated_at' | 'registered_by'> {}

class Solution extends Model<SolutionAttributes, SolutionCreationAttributes> implements SolutionAttributes {
  public id!: string;
  public solution_name!: string;
  public company_code!: string;
  public description?: string;
  public version?: string;
  public is_active?: boolean;
  public created_at?: Date;
  public updated_at?: Date;
  public registered_by?: string;
}

Solution.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
    },
    solution_name: {
      type: DataTypes.STRING(255),
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
    version: {
      type: DataTypes.STRING(50),
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
    modelName: 'Solution',
    tableName: 'solutions',
    timestamps: false,
  }
);

export default Solution; 