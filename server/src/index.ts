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
  'http://localhost:5173',
  'http://211.188.55.145',
  'http://211.188.55.145:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // 서버-서버 통신 등
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
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
