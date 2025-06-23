import { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeRequirement = async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: '분석할 텍스트가 필요합니다.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // 또는 gpt-4
      messages: [
        { 
          role: "system", 
          content: `You are a proficient project manager. Your task is to analyze the user's requirement text and extract key information. The output must be in JSON format with two keys: 'content' and 'deadline'. The 'content' should be a concise summary of the requirement. The 'deadline' should be in YYYY-MM-DD format. If no deadline is mentioned, return null for the 'deadline'.`
        },
        { 
          role: "user", 
          content: text 
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message?.content;
    if (result) {
      res.json(JSON.parse(result));
    } else {
      throw new Error('AI 분석 결과를 파싱하는데 실패했습니다.');
    }

  } catch (error: any) {
    console.error('OpenAI API 오류:', error.message);
    res.status(500).json({ message: 'AI 요구사항 분석에 실패했습니다.' });
  }
}; 