import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';
import bcrypt from 'bcrypt';

export async function createUser(data: {
  id: string;
  password: string;
  email: string;
  birth: string;
  name: string;
  position_code: string;
  department: string;
  join_date: string;
  role_code?: string;
}) {
  const {
    id,
    password,
    email,
    birth,
    name,
    position_code,
    department,
    join_date,
    role_code = 'BASIC',
  } = data;

  const hashed = await bcrypt.hash(password, 10);
  const ym = join_date.slice(2, 4) + join_date.slice(5, 7); // YYMM
  const [countResult]: any = await sequelize.query(
    'SELECT COUNT(*) FROM users WHERE user_code LIKE :ym',
    { replacements: { ym: `${ym}%` }, type: QueryTypes.SELECT }
  );
  const seq = String(Number(countResult.count) + 1).padStart(2, '0');
  const user_code = `${ym}${seq}`;

  await sequelize.query(
    `INSERT INTO users (
      id, password, email, birth, name, position_code,
      department, join_date, user_code, role_code
    ) VALUES (:id,:password,:email,:birth,:name,:position_code,:department,:join_date,:user_code,:role_code)`,
    {
      replacements: {
        id,
        password: hashed,
        email,
        birth,
        name,
        position_code,
        department,
        join_date,
        user_code,
        role_code,
      },
      type: QueryTypes.INSERT,
    }
  );

  return { success: true, user_code };
}