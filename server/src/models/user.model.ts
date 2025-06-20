import pool from '../config/db'; // ✅ 이 pool만 사용
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

  const client = await pool.connect();
  try {
    const hashed = await bcrypt.hash(password, 10);

    // user_code 생성: 예) 2505 + 01 (중복 방지를 위해 시퀀스 번호 필요)
    const ym = join_date.slice(2, 4) + join_date.slice(5, 7); // YYMM
    const { rows } = await client.query(
      'SELECT COUNT(*) FROM users WHERE user_code LIKE $1',
      [`${ym}%`]
    );
    const seq = String(Number(rows[0].count) + 1).padStart(2, '0');
    const user_code = `${ym}${seq}`;

    const insertQuery = `
      INSERT INTO users (
        id, password, email, birth, name, position_code,
        department, join_date, user_code, role_code
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `;

    await client.query(insertQuery, [
      id,
      hashed,
      email,
      birth,
      name,
      position_code,
      department,
      join_date,
      user_code,
      role_code,
    ]);

    return { success: true, user_code };
  } catch (err) {
    console.error('❌ createUser error:', err);
    throw err;
  } finally {
    client.release();
  }
}