import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import positionRouter from './routes/position.route';
import noticeRouter from './routes/notice.route';
import projectRouter from './routes/project.route';

import pool from './config/db';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:5173', // 개발용
      'http://211.188.55.145', // 배포용
      'http://211.188.55.145:5173', // 필요시 포트 포함
      // 필요하다면 https도 추가
    ],
    credentials: true, // withCredentials 허용
  })
);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/positions', positionRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/projects', projectRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

pool.query('SELECT NOW()')
  .then(res => console.log('✅ DB 연결 성공:', res.rows[0]))
  .catch(err => console.error('❌ DB 연결 실패:', err));
