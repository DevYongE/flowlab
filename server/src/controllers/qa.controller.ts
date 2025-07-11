import { Request, Response } from 'express';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';

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
        q.created_at,
        q.updated_at,
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
        q.created_at,
        q.updated_at,
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
        a.created_at,
        a.updated_at,
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
          tags: JSON.stringify(tags)
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

// QA 질문 수정
export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      category,
      priority,
      tags = []
    } = req.body;

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
      res.status(403).json({ message: '수정 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      `UPDATE qa_questions 
       SET title = :title, content = :content, category = :category, 
           priority = :priority, tags = :tags, updated_at = NOW()
       WHERE id = :id`,
      {
        replacements: {
          id,
          title,
          content,
          category,
          priority,
          tags: JSON.stringify(tags)
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
      res.status(403).json({ message: '삭제 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      'DELETE FROM qa_questions WHERE id = :id',
      { replacements: { id }, type: QueryTypes.DELETE }
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

    res.status(201).json({ 
      message: '답변이 등록되었습니다.',
      answerId 
    });
  } catch (error) {
    console.error('답변 등록 오류:', error);
    res.status(500).json({ message: '답변 등록에 실패했습니다.' });
  }
};

// QA 답변 채택
export const acceptAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId, answerId } = req.params;
    const currentUserId = req.user?.id;

    // 질문 작성자인지 확인
    const questionCheck = await sequelize.query(
      'SELECT author_id FROM qa_questions WHERE id = :questionId',
      { replacements: { questionId }, type: QueryTypes.SELECT }
    );

    if (!questionCheck.length) {
      res.status(404).json({ message: '질문을 찾을 수 없습니다.' });
      return;
    }

    const question = questionCheck[0] as any;

    if (currentUserId !== question.author_id) {
      res.status(403).json({ message: '질문 작성자만 답변을 채택할 수 있습니다.' });
      return;
    }

    // 답변 존재 확인
    const answerCheck = await sequelize.query(
      'SELECT id FROM qa_answers WHERE id = :answerId AND question_id = :questionId',
      { replacements: { answerId, questionId }, type: QueryTypes.SELECT }
    );

    if (!answerCheck.length) {
      res.status(404).json({ message: '답변을 찾을 수 없습니다.' });
      return;
    }

    // 답변 채택 (트리거에서 자동으로 질문 상태 업데이트)
    await sequelize.query(
      'UPDATE qa_answers SET is_accepted = true WHERE id = :answerId',
      { replacements: { answerId }, type: QueryTypes.UPDATE }
    );

    res.json({ message: '답변이 채택되었습니다.' });
  } catch (error) {
    console.error('답변 채택 오류:', error);
    res.status(500).json({ message: '답변 채택에 실패했습니다.' });
  }
};

// QA 투표 (질문/답변)
export const vote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, id } = req.params; // type: 'question' or 'answer'
    const { voteType } = req.body; // 'UP' or 'DOWN'
    const userId = req.user?.id;

    if (!['UP', 'DOWN'].includes(voteType)) {
      res.status(400).json({ message: '올바른 투표 타입을 선택해주세요.' });
      return;
    }

    const questionId = type === 'question' ? id : null;
    const answerId = type === 'answer' ? id : null;

    // 기존 투표 확인
    const existingVote = await sequelize.query(
      `SELECT vote_type FROM qa_votes 
       WHERE user_id = :userId AND 
       (question_id = :questionId OR answer_id = :answerId)`,
      { 
        replacements: { userId, questionId, answerId }, 
        type: QueryTypes.SELECT 
      }
    );

    if (existingVote.length > 0) {
      const currentVoteType = (existingVote[0] as any).vote_type;
      
      if (currentVoteType === voteType) {
        // 같은 투표 타입이면 투표 취소
        await sequelize.query(
          `DELETE FROM qa_votes 
           WHERE user_id = :userId AND 
           (question_id = :questionId OR answer_id = :answerId)`,
          { 
            replacements: { userId, questionId, answerId }, 
            type: QueryTypes.DELETE 
          }
        );
        res.json({ message: '투표가 취소되었습니다.' });
      } else {
        // 다른 투표 타입이면 투표 변경
        await sequelize.query(
          `UPDATE qa_votes SET vote_type = :voteType
           WHERE user_id = :userId AND 
           (question_id = :questionId OR answer_id = :answerId)`,
          { 
            replacements: { userId, questionId, answerId, voteType }, 
            type: QueryTypes.UPDATE 
          }
        );
        res.json({ message: '투표가 변경되었습니다.' });
      }
    } else {
      // 새로운 투표
      await sequelize.query(
        `INSERT INTO qa_votes (user_id, question_id, answer_id, vote_type)
         VALUES (:userId, :questionId, :answerId, :voteType)`,
        { 
          replacements: { userId, questionId, answerId, voteType }, 
          type: QueryTypes.INSERT 
        }
      );
      res.json({ message: '투표가 등록되었습니다.' });
    }
  } catch (error) {
    console.error('투표 처리 오류:', error);
    res.status(500).json({ message: '투표 처리에 실패했습니다.' });
  }
};

// QA 통계 조회
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;
    const currentUserCompany = req.user?.company_code;

    let companyFilter = '';
    const replacements: any = {};

    // 회사별 필터링
    if (currentUserRole === 'MANAGER') {
      companyFilter = 'AND p.company_code = :company_code';
      replacements.company_code = currentUserCompany;
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_questions,
        COUNT(CASE WHEN q.status = 'OPEN' THEN 1 END) as open_questions,
        COUNT(CASE WHEN q.status = 'RESOLVED' THEN 1 END) as resolved_questions,
        COUNT(CASE WHEN q.author_id = :userId THEN 1 END) as my_questions
      FROM qa_questions q
      LEFT JOIN projects p ON q.project_id = p.id
      WHERE 1=1 ${companyFilter}
    `;

    replacements.userId = currentUserId;

    const stats = await sequelize.query(statsQuery, { 
      replacements, 
      type: QueryTypes.SELECT 
    });

    const result = stats[0] as any;

    res.json({
      totalQuestions: parseInt(result.total_questions),
      openQuestions: parseInt(result.open_questions),
      resolvedQuestions: parseInt(result.resolved_questions),
      myQuestions: parseInt(result.my_questions)
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ message: '통계 조회에 실패했습니다.' });
  }
}; 