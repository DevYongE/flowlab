// server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export const loginUser = async (req: Request, res: Response) => {
  const { id, password } = req.body;
  console.log('🧪 Supabase 연결 정보 확인:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
  });
  try {
    const users = await sequelize.query(
      `SELECT u.*, p.name AS position_name FROM users u LEFT JOIN positions p ON u.position_code = p.position_code WHERE u.id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    ) as any[];
    const user = users[0] as any;
    if (!user) {
      res.status(401).json({ success: false, message: '존재하지 않는 계정입니다.' });
      return;
    }
    if (!user.password || !password) {
      res.status(401).json({ success: false, message: '비밀번호가 설정되지 않았거나 입력되지 않았습니다.' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role_code,
        userCode: user.user_code,
        company_code: user.company_code,
      },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '2h' }
    );
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        position_name: user.position_name,
        role_code: user.role_code,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '로그인 실패', error: err });
  }
};

// 비밀번호 재설정 요청 (이메일 발송)
export const forgotPassword = async (req: Request, res: Response) => {
  const { id, email } = req.body;
  try {
    // 💡 추가: 이메일 설정 확인
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email service is not configured. Please check your .env file.');
      res.status(500).json({ message: '이메일 서비스가 설정되지 않았습니다. 관리자에게 문의하세요.' });
      return;
    }

    // 사용자 확인
    const users = await sequelize.query('SELECT * FROM users WHERE id = :id', { replacements: { id }, type: QueryTypes.SELECT }) as any[];
    const user = users[0] as any;
    if (!user) {
      res.status(404).json({ message: '존재하지 않는 계정입니다.' });
      return;
    }
    if (!user.email || user.email !== email) {
      res.status(400).json({ message: '이메일 정보가 일치하지 않습니다.' });
      return;
    }

    // 토큰 생성 및 저장
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30분 유효
    await sequelize.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (:user_id, :token, :expires_at)',
      { replacements: { user_id: user.id, token, expires_at: expiresAt }, type: QueryTypes.INSERT }
    );

    // 이메일 발송
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const resetUrl = `${process.env.FRONTEND_URL || 'https://flowlab.vercel.app'}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '[FlowLab] 비밀번호 재설정 안내',
      html: `<p>비밀번호 재설정 요청이 접수되었습니다.<br/>
      아래 링크를 클릭하여 새 비밀번호를 설정해 주세요.<br/>
      <a href="${resetUrl}">${resetUrl}</a><br/>
      (본 메일은 30분간만 유효합니다.)</p>`
    });
    res.json({ message: '비밀번호 재설정 링크가 이메일로 발송되었습니다.' });
  } catch (error) {
    console.error('❌ forgotPassword error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: '비밀번호 재설정 요청 처리 중 오류 발생' });
  }
};

// 비밀번호 재설정 (토큰 검증 및 변경)
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  try {
    const tokens = await sequelize.query(
      'SELECT * FROM password_reset_tokens WHERE token = :token AND used = FALSE AND expires_at > NOW()',
      { replacements: { token }, type: QueryTypes.SELECT }
    ) as any[];
    const resetToken = tokens[0] as any;
    if (!resetToken) {
      res.status(400).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
      return;
    }
    const hash = await bcrypt.hash(newPassword, 10);
    await sequelize.query('UPDATE users SET password = :password WHERE id = :id', {
      replacements: { password: hash, id: resetToken.user_id },
      type: QueryTypes.UPDATE
    });
    await sequelize.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = :id', {
      replacements: { id: resetToken.id },
      type: QueryTypes.UPDATE
    });
    res.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    console.error('❌ resetPassword error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: '비밀번호 재설정 처리 중 오류 발생' });
  }
};
