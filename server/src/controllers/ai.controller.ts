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
      model: "gpt-4o", // 또는 gpt-4
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

// AI를 사용하여 프로젝트 설명에서 WBS를 생성하는 함수
export const generateWbsFromProjectDescription = async (req: Request, res: Response) => {
  const { projectDescription } = req.body;

  if (!projectDescription) {
    res.status(400).json({ message: '프로젝트 설명이 필요합니다.' });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // 또는 gpt-4
      messages: [
        {
          role: "system",
          content: `You are an expert project manager and WBS (Work Breakdown Structure) specialist. Based on the provided project description, generate a hierarchical WBS. Each WBS item should have a 'content' (task description), an optional 'deadline' (in YYYY-MM-DD format), and a 'parent_id' to indicate its hierarchy (null for top-level tasks). Assign a sequential 'order' for siblings at the same level. The output must be a single JSON object with one key: "wbs". This key should hold an array of objects, where each object represents a WBS item. Ensure the content is in Korean if the input is Korean.

Follow these 3-level WBS structure guidelines:
1. **대분류 (Phase or Major Task)**: Divide the entire project into large work units.
2. **중분류 (Deliverables or Sub-task)**: Divide detailed tasks under each major category.
3. **소분류 (Work Package or Activity)**: Further break down sub-tasks into actionable work packages.

Example output:
{
  "wbs": [
    { "content": "웹사이트 개발", "deadline": null, "parent_id": null, "order": 0 },
    { "content": "프론트엔드 개발", "deadline": null, "parent_id": 1, "order": 0 },
    { "content": "사용자 인증 기능", "deadline": "2024-08-20", "parent_id": 2, "order": 0 },
    { "content": "로그인 페이지 구현", "deadline": "2024-08-15", "parent_id": 3, "order": 0 },
    { "content": "회원가입 페이지 구현", "deadline": "2024-08-20", "parent_id": 3, "order": 1 },
    { "content": "상품 목록 페이지", "deadline": "2024-08-25", "parent_id": 2, "order": 1 },
    { "content": "백엔드 개발", "deadline": null, "parent_id": 1, "order": 1 },
    { "content": "API 설계", "deadline": "2024-08-10", "parent_id": 7, "order": 0 }
  ]
}`
        },
        {
          role: "user",
          content: projectDescription
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message?.content;
    if (result) {
      res.json(JSON.parse(result));
    } else {
      throw new Error('AI WBS 생성 결과를 파싱하는데 실패했습니다.');
    }

  } catch (error: any) {
    console.error('OpenAI API 오류 (WBS 생성):', error.message);
    res.status(500).json({ message: 'AI WBS 생성에 실패했습니다.' });
  }
}; 