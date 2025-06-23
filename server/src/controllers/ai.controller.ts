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
    res.status(400).json({ message: '분석할 텍스트가 필요합니다.' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125", // 또는 gpt-4
      messages: [
        { 
          role: "system", 
          content: `You are a proficient project manager. Based on the user's text, identify all individual requirements. For each requirement, extract a 'content' (summary) and a 'deadline' (in YYYY-MM-DD format). If no deadline is specified, the deadline should be null. The final output must be a single JSON object with one key: "requirements". This key should hold an array of objects, where each object represents a single requirement and has 'content' and 'deadline' keys. If the original text is in Korean, the 'content' must also be in Korean.
Example output: { "requirements": [{ "content": "로그인 기능 구현", "deadline": "2024-08-15" }, { "content": "게시판 UI 디자인", "deadline": null }] }`
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