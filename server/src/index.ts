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

const allowedOrigins = [
  'http://localhost:5173', // 로컬 개발용
  'https://flowlab-g0rikkpld-yonges-projects.vercel.app', // 이전 Vercel 배포 주소
  'https://flowlab-rtia1bcb6-yonges-projects.vercel.app'  // 새로운 Vercel 배포 주소 (오타 수정)
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log('Request Origin:', origin);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
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
