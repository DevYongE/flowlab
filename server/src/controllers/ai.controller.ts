import { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

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

// AI를 사용하여 WBS를 생성하고 즉시 데이터베이스에 저장하는 통합 함수
export const generateAndSaveWbs = async (req: Request, res: Response) => {
  const { projectId, prompt, projectDescription } = req.body;
  const authorId = req.user?.id;
  const currentUserRole = req.user?.role;

  // 필수 파라미터 검증
  if (!projectId || !projectDescription) {
    res.status(400).json({ message: '프로젝트 ID와 프로젝트 설명이 필요합니다.' });
    return;
  }

  if (!authorId) {
    res.status(401).json({ message: '로그인 정보가 필요합니다.' });
    return;
  }

  try {
    // 1. 프로젝트 소유권 확인
    const projectQuery = await sequelize.query(
      'SELECT author_id, company_code FROM projects WHERE id = :project_id', 
      { replacements: { project_id: projectId }, type: QueryTypes.SELECT }
    );

    if (!Array.isArray(projectQuery) || projectQuery.length === 0) {
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
      return;
    }

    const project = projectQuery[0] as any;
    
    // 권한 확인 (ADMIN, 프로젝트 소유자, 또는 같은 회사의 MANAGER만 가능)
    if (currentUserRole !== 'ADMIN' && 
        authorId !== project.author_id && 
        !(currentUserRole === 'MANAGER' && req.user?.company_code === project.company_code)) {
      res.status(403).json({ message: '이 프로젝트에 WBS를 생성할 권한이 없습니다.' });
      return;
    }

    // 2. AI를 사용하여 WBS 생성
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
    const currentYear = new Date().getFullYear();
    
    const systemPrompt = prompt || `당신은 숙련된 프로젝트 매니저이자 WBS(Work Breakdown Structure) 전문가입니다. 
제공된 프로젝트 설명을 바탕으로 계층적 WBS를 생성해주세요. 

**중요한 날짜 정보:**
- 오늘 날짜: ${today}
- 현재 연도: ${currentYear}
- 모든 마감일은 오늘 날짜 이후로 설정해주세요.

WBS는 다음과 같은 3단계 구조로 작성해주세요:
1. **대분류 (Phase or Major Task)**: 전체 프로젝트를 큰 작업 단위로 나눕니다.
2. **중분류 (Deliverables or Sub-task)**: 각 대분류 아래 세부 작업을 나눕니다.
3. **소분류 (Work Package or Activity)**: 실제 작업자들이 수행할 수 있는 최소 단위의 작업입니다.

각 WBS 항목은 다음을 포함해야 합니다:
- 'content': 작업 설명 (한국어)
- 'deadline': 마감일 (YYYY-MM-DD 형식, 오늘 날짜 이후로 설정)
- 'parent_id': 상위 작업 ID (최상위는 null)
- 'order': 같은 레벨에서의 순서

출력은 반드시 "wbs" 키를 가진 JSON 객체여야 하며, 그 값은 WBS 항목들의 배열이어야 합니다.

주의사항:
- 중복 없이, 논리적 순서에 맞게 정리해주세요.
- 소분류는 구체적인 작업 단위로 명확히 작성해주세요.
- 가능하면 각 작업이 산출물 중심이 되도록 해주세요.
- 마감일은 오늘(${today}) 이후로 프로젝트 일정에 맞게 현실적으로 배분해주세요.
- 작업의 복잡도와 의존관계를 고려하여 적절한 기간을 할당해주세요.

예시 출력 (오늘이 ${today}인 경우):
{
  "wbs": [
    { "content": "프로젝트 계획 수립", "deadline": "${currentYear}-02-01", "parent_id": null, "order": 0 },
    { "content": "요구사항 분석", "deadline": "${currentYear}-02-15", "parent_id": 1, "order": 0 },
    { "content": "시스템 설계", "deadline": "${currentYear}-02-28", "parent_id": 1, "order": 1 }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: projectDescription
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const aiResult = completion.choices[0].message?.content;
    if (!aiResult) {
      throw new Error('AI로부터 응답을 받지 못했습니다.');
    }

    const parsedResult = JSON.parse(aiResult);
    const wbsItems = parsedResult.wbs;

    if (!Array.isArray(wbsItems) || wbsItems.length === 0) {
      throw new Error('AI가 유효한 WBS를 생성하지 못했습니다.');
    }

    // 3. 생성된 WBS를 데이터베이스에 저장
    await sequelize.query('BEGIN'); // 트랜잭션 시작

    try {
      // WBS 항목에 임시 ID 할당 (AI가 생성한 순서대로)
      const wbsWithTempIds = wbsItems.map((item, index) => ({
        ...item,
        tempId: index + 1, // 1부터 시작하는 임시 ID
        originalIndex: index
      }));

      // ID 매핑을 위한 Map (임시 ID -> 실제 DB ID)
      const idMapping = new Map<number | null, number | null>();
      idMapping.set(null, null); // null은 그대로 유지

      // 계층 순서대로 정렬 (부모가 먼저 생성되어야 함)
      const sortedItems = [...wbsWithTempIds].sort((a, b) => {
        // parent_id가 null인 것(최상위)이 먼저
        if (a.parent_id === null && b.parent_id !== null) return -1;
        if (a.parent_id !== null && b.parent_id === null) return 1;
        
        // 둘 다 null이거나 둘 다 null이 아닌 경우, 원래 순서 유지
        return a.originalIndex - b.originalIndex;
      });

      for (const item of sortedItems) {
        const { content, deadline, parent_id, order, tempId } = item;
        
        // parent_id를 실제 DB ID로 변환
        let actualParentId: number | null = null;
        if (parent_id !== null) {
          // parent_id가 있는 경우, 매핑에서 실제 ID를 찾음
          const parentTempId = parent_id;
          actualParentId = idMapping.get(parentTempId) || null;
          
          if (actualParentId === null && parent_id !== null) {
            console.warn(`부모 ID ${parent_id}를 찾을 수 없습니다. 최상위 항목으로 처리합니다.`);
          }
        }

        const insertResult = await sequelize.query(
          `INSERT INTO dev_notes (project_id, content, deadline, status, progress, author_id, parent_id, "order", completed_at) 
           VALUES (:projectId, :content, :deadline, 'TODO', 0, :authorId, :parent_id, :order, null) 
           RETURNING id`,
          {
            replacements: {
              projectId,
              content,
              deadline: deadline || null,
              authorId,
              parent_id: actualParentId,
              order: order || 0
            },
            type: QueryTypes.SELECT
          }
        );

        // 새로 생성된 실제 ID를 매핑에 추가
        if (Array.isArray(insertResult) && insertResult.length > 0) {
          const newId = (insertResult[0] as any).id;
          idMapping.set(tempId, newId);
          
          console.log(`WBS 항목 생성: ${content} (임시ID: ${tempId} -> 실제ID: ${newId}, 부모ID: ${actualParentId})`);
        }
      }

      await sequelize.query('COMMIT'); // 트랜잭션 커밋

      // 4. 성공 응답
      res.status(201).json({ 
        message: 'AI WBS 생성 및 저장이 완료되었습니다.',
        itemsCreated: wbsItems.length,
        wbs: wbsItems
      });

    } catch (dbError) {
      await sequelize.query('ROLLBACK'); // 오류 발생 시 롤백
      throw dbError;
    }

  } catch (error: any) {
    console.error('AI WBS 생성 및 저장 오류:', error);
    
    if (error.message.includes('AI')) {
      res.status(500).json({ message: 'AI WBS 생성에 실패했습니다.', error: error.message });
    } else {
      res.status(500).json({ message: 'WBS 저장에 실패했습니다.', error: error.message });
    }
  }
}; 