import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/db';

// QA 질문 목록 조회
export const getQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      search, 
      project, 
      category, 
      status, 
      sort = 'latest',
      page = 1,
      limit = 20
    } = req.query;

    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const currentUserCompany = req.user?.company_code;

    let whereClause = '';
    let orderClause = '';
    const replacements: any = {};

    // 검색 조건 구성
    if (search) {
      whereClause += ' AND (q.title ILIKE :search OR q.content ILIKE :search)';
      replacements.search = `%${search}%`;
    }

    if (project) {
      whereClause += ' AND p.name = :project';
      replacements.project = project;
    }

    if (category) {
      whereClause += ' AND q.category = :category';
      replacements.category = category;
    }

    if (status) {
      whereClause += ' AND q.status = :status';
      replacements.status = status;
    }

    // 회사별 필터링 (MANAGER는 자신의 회사만, ADMIN은 모든 회사)
    if (currentUserRole === 'MANAGER') {
      whereClause += ' AND p.company_code = :company_code';
      replacements.company_code = currentUserCompany;
    }

    // 정렬 조건
    switch (sort) {
      case 'oldest':
        orderClause = 'ORDER BY q.created_at ASC';
        break;
      case 'most_voted':
        orderClause = 'ORDER BY q.vote_count DESC, q.created_at DESC';
        break;
      case 'most_viewed':
        orderClause = 'ORDER BY q.view_count DESC, q.created_at DESC';
        break;
      case 'most_answered':
        orderClause = 'ORDER BY answer_count DESC, q.created_at DESC';
        break;
      default:
        orderClause = 'ORDER BY q.created_at DESC';
    }

    // 페이지네이션
    const offset = (Number(page) - 1) * Number(limit);
    replacements.limit = Number(limit);
    replacements.offset = offset;

    const query = `
      SELECT 
        q.id,
        q.title,
        q.content,
        q.category,
        q.priority,
        q.status,
        q.tags,
        q.view_count,
        q.vote_count,
        TO_CHAR(q.created_at, 'YYYY-MM-DD') as "createdAt",
        TO_CHAR(q.updated_at, 'YYYY-MM-DD') as "updatedAt",
        u.name as "authorName",
        p.name as "projectName",
        COALESCE(a.answer_count, 0) as "answerCount"
      FROM qa_questions q
      LEFT JOIN users u ON q.author_id = u.id
      LEFT JOIN projects p ON q.project_id = p.id
      LEFT JOIN (
        SELECT question_id, COUNT(*) as answer_count
        FROM qa_answers
        GROUP BY question_id
      ) a ON q.id = a.question_id
      WHERE 1=1 ${whereClause}
      ${orderClause}
      LIMIT :limit OFFSET :offset
    `;

    const questions = await sequelize.query(query, { 
      replacements, 
      type: QueryTypes.SELECT 
    });

    res.json(questions);
  } catch (error) {
    console.error('질문 목록 조회 오류:', error);
    res.status(500).json({ message: '질문 목록 조회에 실패했습니다.' });
  }
};

// QA 질문 상세 조회
export const getQuestionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    // 조회수 증가
    await sequelize.query(
      'UPDATE qa_questions SET view_count = view_count + 1 WHERE id = :id',
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    // 질문 정보 조회
    const questionQuery = `
      SELECT 
        q.id,
        q.title,
        q.content,
        q.category,
        q.priority,
        q.status,
        q.tags,
        q.view_count,
        q.vote_count,
        q.accepted_answer_id,
        TO_CHAR(q.created_at, 'YYYY-MM-DD') as "createdAt",
        TO_CHAR(q.updated_at, 'YYYY-MM-DD') as "updatedAt",
        q.author_id,
        u.name as "authorName",
        p.name as "projectName",
        p.id as "projectId"
      FROM qa_questions q
      LEFT JOIN users u ON q.author_id = u.id
      LEFT JOIN projects p ON q.project_id = p.id
      WHERE q.id = :id
    `;

    const questions = await sequelize.query(questionQuery, { 
      replacements: { id }, 
      type: QueryTypes.SELECT 
    });

    if (!questions.length) {
      res.status(404).json({ message: '질문을 찾을 수 없습니다.' });
      return;
    }

    const question = questions[0];

    // 답변 목록 조회
    const answersQuery = `
      SELECT 
        a.id,
        a.content,
        a.is_accepted,
        a.vote_count,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') as "createdAt",
        TO_CHAR(a.updated_at, 'YYYY-MM-DD') as "updatedAt",
        a.author_id,
        u.name as "authorName"
      FROM qa_answers a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.question_id = :id
      ORDER BY a.is_accepted DESC, a.vote_count DESC, a.created_at ASC
    `;

    const answers = await sequelize.query(answersQuery, { 
      replacements: { id }, 
      type: QueryTypes.SELECT 
    });

    // 사용자 투표 정보 조회 (로그인된 경우)
    let userVotes = {};
    if (currentUserId) {
      const voteQuery = `
        SELECT 
          COALESCE(question_id, 0) as question_id,
          COALESCE(answer_id, 0) as answer_id,
          vote_type
        FROM qa_votes
        WHERE user_id = :userId AND (question_id = :questionId OR answer_id IN (
          SELECT id FROM qa_answers WHERE question_id = :questionId
        ))
      `;

      const votes = await sequelize.query(voteQuery, { 
        replacements: { userId: currentUserId, questionId: id }, 
        type: QueryTypes.SELECT 
      });

      userVotes = votes.reduce((acc: any, vote: any) => {
        const key = vote.question_id > 0 ? `question_${vote.question_id}` : `answer_${vote.answer_id}`;
        acc[key] = vote.vote_type;
        return acc;
      }, {});
    }

    res.json({
      question,
      answers,
      userVotes
    });
  } catch (error) {
    console.error('질문 상세 조회 오류:', error);
    res.status(500).json({ message: '질문 상세 조회에 실패했습니다.' });
  }
};

// QA 질문 등록
export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      content,
      category = 'GENERAL',
      priority = 'NORMAL',
      projectId,
      tags = []
    } = req.body;

    const authorId = req.user?.id;

    if (!title || !content || !projectId) {
      res.status(400).json({ message: '필수 정보를 모두 입력해주세요.' });
      return;
    }

    // 프로젝트 존재 확인
    const projectCheck = await sequelize.query(
      'SELECT id FROM projects WHERE id = :projectId',
      { replacements: { projectId }, type: QueryTypes.SELECT }
    );

    if (!projectCheck.length) {
      res.status(404).json({ message: '존재하지 않는 프로젝트입니다.' });
      return;
    }

    const result = await sequelize.query(
      `INSERT INTO qa_questions (title, content, category, priority, project_id, author_id, tags)
       VALUES (:title, :content, :category, :priority, :projectId, :authorId, :tags)
       RETURNING id`,
      {
        replacements: {
          title,
          content,
          category,
          priority,
          projectId,
          authorId,
          tags: tags.length > 0 ? `{${tags.map((tag: string) => `"${tag.replace(/"/g, '\\"')}"`).join(',')}}` : '{}'
        },
        type: QueryTypes.INSERT
      }
    );

    const questionId = (result[0] as any).id;

    res.status(201).json({ 
      message: '질문이 등록되었습니다.',
      questionId 
    });
  } catch (error) {
    console.error('질문 등록 오류:', error);
    res.status(500).json({ message: '질문 등록에 실패했습니다.' });
  }
};

// QA 통계 조회
export const getQAStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const currentUserCompany = req.user?.company_code;

    // 전체 질문 수
    const totalQuestionsQuery = currentUserRole === 'ADMIN' 
      ? 'SELECT COUNT(*) as count FROM qa_questions'
      : 'SELECT COUNT(*) as count FROM qa_questions q JOIN projects p ON q.project_id = p.id WHERE p.company_code = :company_code';

    const totalQuestionsResult = await sequelize.query(
      totalQuestionsQuery,
      {
        replacements: currentUserRole === 'ADMIN' ? {} : { company_code: currentUserCompany },
        type: QueryTypes.SELECT
      }
    );

    // 미해결 질문 수
    const openQuestionsQuery = currentUserRole === 'ADMIN'
      ? 'SELECT COUNT(*) as count FROM qa_questions WHERE status IN (\'OPEN\', \'IN_PROGRESS\')'
      : 'SELECT COUNT(*) as count FROM qa_questions q JOIN projects p ON q.project_id = p.id WHERE p.company_code = :company_code AND q.status IN (\'OPEN\', \'IN_PROGRESS\')';

    const openQuestionsResult = await sequelize.query(
      openQuestionsQuery,
      {
        replacements: currentUserRole === 'ADMIN' ? {} : { company_code: currentUserCompany },
        type: QueryTypes.SELECT
      }
    );

    // 해결된 질문 수
    const resolvedQuestionsQuery = currentUserRole === 'ADMIN'
      ? 'SELECT COUNT(*) as count FROM qa_questions WHERE status = \'RESOLVED\''
      : 'SELECT COUNT(*) as count FROM qa_questions q JOIN projects p ON q.project_id = p.id WHERE p.company_code = :company_code AND q.status = \'RESOLVED\'';

    const resolvedQuestionsResult = await sequelize.query(
      resolvedQuestionsQuery,
      {
        replacements: currentUserRole === 'ADMIN' ? {} : { company_code: currentUserCompany },
        type: QueryTypes.SELECT
      }
    );

    // 내 질문 수
    const myQuestionsResult = await sequelize.query(
      'SELECT COUNT(*) as count FROM qa_questions WHERE author_id = :author_id',
      {
        replacements: { author_id: currentUserId },
        type: QueryTypes.SELECT
      }
    );

    const stats = {
      totalQuestions: parseInt((totalQuestionsResult[0] as any).count),
      openQuestions: parseInt((openQuestionsResult[0] as any).count),
      resolvedQuestions: parseInt((resolvedQuestionsResult[0] as any).count),
      myQuestions: parseInt((myQuestionsResult[0] as any).count)
    };

    res.json(stats);
  } catch (error) {
    console.error('QA 통계 조회 오류:', error);
    res.status(500).json({ message: 'QA 통계 조회에 실패했습니다.' });
  }
};

// QA 질문 수정
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, tags, projectId } = req.body;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 질문 존재 확인 및 권한 체크
    const questionCheck = await sequelize.query(
      'SELECT author_id FROM qa_questions WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!questionCheck.length) {
      res.status(404).json({ message: '질문을 찾을 수 없습니다.' });
      return;
    }

    const question = questionCheck[0] as any;

    // 권한 확인 (작성자 또는 관리자만 수정 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== question.author_id) {
      res.status(403).json({ message: '질문을 수정할 권한이 없습니다.' });
      return;
    }

    // 태그 배열을 PostgreSQL 배열 형식으로 변환
    const tagsArray = Array.isArray(tags) && tags.length > 0 
      ? `{${tags.map((tag: string) => `"${tag.replace(/"/g, '\\"')}"`).join(',')}}`
      : '{}';

    await sequelize.query(
      `UPDATE qa_questions 
       SET title = :title, content = :content, category = :category, 
           priority = :priority, tags = :tags, project_id = :projectId, updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id,
          title,
          content,
          category,
          priority,
          tags: tagsArray,
          projectId
        },
        type: QueryTypes.UPDATE
      }
    );

    res.json({ message: '질문이 수정되었습니다.' });
  } catch (error) {
    console.error('질문 수정 오류:', error);
    res.status(500).json({ message: '질문 수정에 실패했습니다.' });
  }
};

// QA 질문 삭제
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 질문 존재 확인 및 권한 체크
    const questionCheck = await sequelize.query(
      'SELECT author_id FROM qa_questions WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!questionCheck.length) {
      res.status(404).json({ message: '질문을 찾을 수 없습니다.' });
      return;
    }

    const question = questionCheck[0] as any;

    // 권한 확인 (작성자 또는 관리자만 삭제 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== question.author_id) {
      res.status(403).json({ message: '질문을 삭제할 권한이 없습니다.' });
      return;
    }

    // 질문 삭제 (CASCADE로 답변들도 자동 삭제됨)
    await sequelize.query(
      'DELETE FROM qa_questions WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );

    res.json({ message: '질문이 삭제되었습니다.' });
  } catch (error) {
    console.error('질문 삭제 오류:', error);
    res.status(500).json({ message: '질문 삭제에 실패했습니다.' });
  }
};

// QA 답변 등록
export const createAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;
    const authorId = req.user?.id;

    if (!content) {
      res.status(400).json({ message: '답변 내용을 입력해주세요.' });
      return;
    }

    // 질문 존재 확인
    const questionCheck = await sequelize.query(
      'SELECT id FROM qa_questions WHERE id = :questionId',
      { replacements: { questionId }, type: QueryTypes.SELECT }
    );

    if (!questionCheck.length) {
      res.status(404).json({ message: '질문을 찾을 수 없습니다.' });
      return;
    }

    const result = await sequelize.query(
      `INSERT INTO qa_answers (question_id, content, author_id)
       VALUES (:questionId, :content, :authorId)
       RETURNING id`,
      {
        replacements: {
          questionId,
          content,
          authorId
        },
        type: QueryTypes.INSERT
      }
    );

    const answerId = (result[0] as any).id;

    // 첫 번째 답변이 등록되면 질문 상태를 IN_PROGRESS로 변경
    await sequelize.query(
      `UPDATE qa_questions 
       SET status = 'IN_PROGRESS', updated_at = NOW() 
       WHERE id = :questionId AND status = 'OPEN'`,
      {
        replacements: { questionId },
        type: QueryTypes.UPDATE
      }
    );

    res.status(201).json({ 
      message: '답변이 등록되었습니다.',
      answerId 
    });
  } catch (error) {
    console.error('답변 등록 오류:', error);
    res.status(500).json({ message: '답변 등록에 실패했습니다.' });
  }
};

// QA 답변 수정
export const updateAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 답변 존재 확인 및 권한 체크
    const answerCheck = await sequelize.query(
      'SELECT author_id FROM qa_answers WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!answerCheck.length) {
      res.status(404).json({ message: '답변을 찾을 수 없습니다.' });
      return;
    }

    const answer = answerCheck[0] as any;

    // 권한 확인 (작성자 또는 관리자만 수정 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== answer.author_id) {
      res.status(403).json({ message: '답변을 수정할 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      'UPDATE qa_answers SET content = :content, updated_at = NOW() WHERE id = :id',
      {
        replacements: { id, content },
        type: QueryTypes.UPDATE
      }
    );

    res.json({ message: '답변이 수정되었습니다.' });
  } catch (error) {
    console.error('답변 수정 오류:', error);
    res.status(500).json({ message: '답변 수정에 실패했습니다.' });
  }
};

// QA 답변 삭제
export const deleteAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 답변 존재 확인 및 권한 체크
    const answerCheck = await sequelize.query(
      'SELECT author_id FROM qa_answers WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!answerCheck.length) {
      res.status(404).json({ message: '답변을 찾을 수 없습니다.' });
      return;
    }

    const answer = answerCheck[0] as any;

    // 권한 확인 (작성자 또는 관리자만 삭제 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== answer.author_id) {
      res.status(403).json({ message: '답변을 삭제할 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      'DELETE FROM qa_answers WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.DELETE
      }
    );

    res.json({ message: '답변이 삭제되었습니다.' });
  } catch (error) {
    console.error('답변 삭제 오류:', error);
    res.status(500).json({ message: '답변 삭제에 실패했습니다.' });
  }
};

// QA 답변 채택
export const adoptAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 답변 정보 조회
    const answerCheck = await sequelize.query(
      `SELECT a.id, a.question_id, q.author_id as question_author_id
       FROM qa_answers a
       JOIN qa_questions q ON a.question_id = q.id
       WHERE a.id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!answerCheck.length) {
      res.status(404).json({ message: '답변을 찾을 수 없습니다.' });
      return;
    }

    const answer = answerCheck[0] as any;

    // 권한 확인 (질문 작성자 또는 관리자만 채택 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== answer.question_author_id) {
      res.status(403).json({ message: '답변을 채택할 권한이 없습니다.' });
      return;
    }

    // 답변 채택 (트리거에 의해 자동으로 질문 상태가 RESOLVED로 변경됨)
    await sequelize.query(
      'UPDATE qa_answers SET is_accepted = TRUE, updated_at = NOW() WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.UPDATE
      }
    );

    res.json({ message: '답변이 채택되었습니다.' });
  } catch (error) {
    console.error('답변 채택 오류:', error);
    res.status(500).json({ message: '답변 채택에 실패했습니다.' });
  }
};

// QA 질문 투표
export const voteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const currentUserId = req.user?.id;

    if (!['UP', 'DOWN'].includes(voteType)) {
      res.status(400).json({ message: '올바른 투표 타입을 선택해주세요.' });
      return;
    }

    // 기존 투표 확인
    const existingVote = await sequelize.query(
      'SELECT * FROM qa_votes WHERE user_id = :user_id AND question_id = :question_id',
      {
        replacements: { user_id: currentUserId, question_id: id },
        type: QueryTypes.SELECT
      }
    );

    if (existingVote.length > 0) {
      // 기존 투표 삭제
      await sequelize.query(
        'DELETE FROM qa_votes WHERE user_id = :user_id AND question_id = :question_id',
        {
          replacements: { user_id: currentUserId, question_id: id },
          type: QueryTypes.DELETE
        }
      );
    }

    // 새 투표 등록
    await sequelize.query(
      'INSERT INTO qa_votes (user_id, question_id, vote_type) VALUES (:user_id, :question_id, :vote_type)',
      {
        replacements: {
          user_id: currentUserId,
          question_id: id,
          vote_type: voteType
        },
        type: QueryTypes.INSERT
      }
    );

    res.json({ message: '투표가 완료되었습니다.' });
  } catch (error) {
    console.error('질문 투표 오류:', error);
    res.status(500).json({ message: '투표에 실패했습니다.' });
  }
};

// QA 답변 투표
export const voteAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const currentUserId = req.user?.id;

    if (!['UP', 'DOWN'].includes(voteType)) {
      res.status(400).json({ message: '올바른 투표 타입을 선택해주세요.' });
      return;
    }

    // 기존 투표 확인
    const existingVote = await sequelize.query(
      'SELECT * FROM qa_votes WHERE user_id = :user_id AND answer_id = :answer_id',
      {
        replacements: { user_id: currentUserId, answer_id: id },
        type: QueryTypes.SELECT
      }
    );

    if (existingVote.length > 0) {
      // 기존 투표 삭제
      await sequelize.query(
        'DELETE FROM qa_votes WHERE user_id = :user_id AND answer_id = :answer_id',
        {
          replacements: { user_id: currentUserId, answer_id: id },
          type: QueryTypes.DELETE
        }
      );
    }

    // 새 투표 등록
    await sequelize.query(
      'INSERT INTO qa_votes (user_id, answer_id, vote_type) VALUES (:user_id, :answer_id, :vote_type)',
      {
        replacements: {
          user_id: currentUserId,
          answer_id: id,
          vote_type: voteType
        },
        type: QueryTypes.INSERT
      }
    );

    res.json({ message: '투표가 완료되었습니다.' });
  } catch (error) {
    console.error('답변 투표 오류:', error);
    res.status(500).json({ message: '투표에 실패했습니다.' });
  }
}; 

// QA 질문 상태 변경
export const updateQuestionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 상태 유효성 검사
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: '올바른 상태를 선택해주세요.' });
      return;
    }

    // 질문 존재 확인 및 권한 체크
    const questionCheck = await sequelize.query(
      'SELECT author_id FROM qa_questions WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!questionCheck.length) {
      res.status(404).json({ message: '질문을 찾을 수 없습니다.' });
      return;
    }

    const question = questionCheck[0] as any;

    // 권한 확인 (작성자 또는 관리자만 상태 변경 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== question.author_id) {
      res.status(403).json({ message: '상태를 변경할 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      'UPDATE qa_questions SET status = :status, updated_at = NOW() WHERE id = :id',
      {
        replacements: { id, status },
        type: QueryTypes.UPDATE
      }
    );

    res.json({ message: '질문 상태가 변경되었습니다.' });
  } catch (error) {
    console.error('질문 상태 변경 오류:', error);
    res.status(500).json({ message: '질문 상태 변경에 실패했습니다.' });
  }
}; 