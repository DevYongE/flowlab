import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import positionRouter from './routes/position.route';
import noticeRouter from './routes/notice.route';
import projectRouter from './routes/project.route';
import aiRoutes from './routes/ai.route';
import roleRouter from './routes/role.route';
import companyRoutes from './routes/company.route';

import sequelize from './config/db';

const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173', // 로컬 개발용
  'https://flowlab.vercel.app', // Vercel 고정 도메인
  'https://flowlab-g0rikkpld-yonges-projects.vercel.app', // 이전 Vercel 배포 주소
  'https://flowlab-rtia1bcb6-yonges-projects.vercel.app',  // 이전 Vercel 배포 주소
  'https://flowlab-acanbs8tk-yonges-projects.vercel.app'  // 최신 Vercel 배포 주소
];

// 🕵️‍♂️ CORS 디버깅용 로그 추가
console.log('Server starting with allowedOrigins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/positions', positionRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/projects', projectRouter);
app.use('/api/ai', aiRoutes);
app.use('/api/roles', roleRouter);
app.use('/api/companies', companyRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// DB 연결 확인 (Sequelize)
sequelize.authenticate()
  .then(() => console.log('✅ DB 연결 성공'))
  .catch(err => console.error('❌ DB 연결 실패:', err));
