import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

// WBS/DevNotes 데이터를 계층 구조로 변환하는 헬퍼 함수
const buildDevNotesTree = (items: any[]): any[] => {
  const itemMap: { [key: number]: any } = {};
  const roots: any[] = [];

  items.forEach(item => {
    itemMap[item.id] = { ...item, children: [] };
  });

  items.forEach(item => {
    if (item.parent_id !== null && itemMap[item.parent_id]) {
      itemMap[item.parent_id].children.push(itemMap[item.id]);
    } else {
      roots.push(itemMap[item.id]);
    }
  });

  // 각 레벨의 자식들을 order 기준으로 정렬
  const sortChildren = (node: any) => {
    if (node.children && node.children.length > 0) {
      node.children.sort((a: any, b: any) => a.order - b.order);
      node.children.forEach(sortChildren);
    }
  };

  roots.forEach(sortChildren);
  roots.sort((a, b) => a.order - b.order);

  return roots;
};

// 프로젝트 목록 조회
export const getProjects = async (req: Request, res: Response) => {
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  try {
    let query = `
      SELECT id, category, type, name, TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate", progress
      FROM projects
    `;
    const params: any = {};

    if (currentUserRole !== 'ADMIN') {
      query += ' WHERE author_id = :author_id';
      params.author_id = currentUserId;
    }

    query += ' ORDER BY start_date DESC';
    const projects = await sequelize.query(query, { replacements: params, type: QueryTypes.SELECT });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: '프로젝트 목록 조회 실패', error });
  }
};

// 프로젝트 상세 조회
export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  try {
    const projectRes = await sequelize.query('SELECT *, TO_CHAR(start_date, \'YYYY-MM-DD\') as "startDate", TO_CHAR(end_date, \'YYYY-MM-DD\') as "endDate" FROM projects WHERE id = :id', { replacements: { id }, type: QueryTypes.SELECT });
    if (projectRes.length === 0) {
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
      return;
    }
    const project = projectRes[0];

    if (currentUserRole !== 'ADMIN' && currentUserId !== project.author_id) {
      res.status(403).json({ message: '프로젝트에 접근할 권한이 없습니다.' });
      return;
    }

    const detailsRes = await sequelize.query('SELECT * FROM project_details WHERE project_id = :project_id', { replacements: { project_id: id }, type: QueryTypes.SELECT });
    project.details = detailsRes[0] || {};
    
    const notesRes = await sequelize.query(
      `SELECT dn.*, u.name as "authorName", TO_CHAR(dn.registered_at, 'YYYY-MM-DD') as "registeredAt" 
       FROM dev_notes dn
       LEFT JOIN users u ON dn.author_id = u.id
       WHERE dn.project_id = :project_id ORDER BY dn.registered_at DESC`, 
      { replacements: { project_id: id }, type: QueryTypes.SELECT }
    );
    project.devNotes = notesRes;

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: '프로젝트 상세 정보 조회 실패', error });
  }
};

// 프로젝트의 DevNotes를 WBS 형식(트리)으로 조회
export const getDevNotesAsWbs = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    const notesRes = await sequelize.query(
      `SELECT dn.*, u.name as "authorName", TO_CHAR(dn.registered_at, 'YYYY-MM-DD') as "registeredAt" 
       FROM dev_notes dn
       LEFT JOIN users u ON dn.author_id = u.id
       WHERE dn.project_id = :project_id 
       ORDER BY dn.parent_id, dn."order" ASC`,
      { replacements: { project_id: projectId }, type: QueryTypes.SELECT }
    );
    const tree = buildDevNotesTree(notesRes);
    res.json(tree);
  } catch (error) {
    console.error('WBS(DevNotes) 조회 오류:', error);
    res.status(500).json({ message: 'WBS(DevNotes) 조회 실패', error });
  }
};

// 프로젝트 상태별 개수 조회
export const getProjectStatusSummary = async (req: Request, res: Response) => {
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  try {
    let query = `
      SELECT
        CASE
          WHEN progress = 0 THEN '미완료'
          WHEN progress >= 100 THEN '완료'
          ELSE '진행중'
        END as status,
        COUNT(id)::int as count
      FROM projects
    `;
    const params: any = {};

    if (currentUserRole !== 'ADMIN') {
      query += ' WHERE author_id = :author_id';
      params.author_id = currentUserId;
    }

    query += ' GROUP BY status';

    const result = await sequelize.query(query, { replacements: params, type: QueryTypes.SELECT });
    res.json(result);
  } catch (error) {
    console.error('프로젝트 상태 요약 조회 실패:', error);
    res.status(500).json({ message: '프로젝트 상태 요약 조회 실패', error });
  }
};

// 프로젝트 생성
export const createProject = async (req: Request, res: Response) => {
  const { category, type, name, startDate, endDate, os, memory, javaVersion, springVersion, reactVersion, vueVersion, tomcatVersion, centricVersion } = req.body;
  const authorId = req.user?.id;

  const client = await sequelize.getQueryInterface().sequelize;
  try {
    await client.query('BEGIN');
    const projectRes = await client.query(
      'INSERT INTO projects (category, type, name, start_date, end_date, os, memory, author_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [category, type, name, startDate, endDate, os, memory, authorId]
    );
    const projectId = projectRes.rows[0].id;

    await client.query(
      'INSERT INTO project_details (project_id, java_version, spring_version, react_version, vue_version, tomcat_version, centric_version) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [projectId, javaVersion, springVersion, reactVersion, vueVersion, tomcatVersion, centricVersion]
    );

    await client.query('COMMIT');
    res.status(201).json({ id: projectId, message: '프로젝트가 성공적으로 생성되었습니다.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: '프로젝트 생성 실패', error });
  }
};

// 프로젝트 수정
export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category, type, name, startDate, endDate, os, memory, javaVersion, springVersion, reactVersion, vueVersion, tomcatVersion, centricVersion } = req.body;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  const client = await sequelize.getQueryInterface().sequelize;
  try {
    await client.query('BEGIN');
    
    const projectRes = await client.query('SELECT author_id FROM projects WHERE id = :id', { replacements: { id } });
    if (projectRes.length === 0) {
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
      return;
    }
    const projectAuthorId = projectRes[0].author_id;

    if (currentUserRole !== 'ADMIN' && currentUserId !== projectAuthorId) {
      res.status(403).json({ message: '프로젝트를 수정할 권한이 없습니다.' });
      return;
    }

    await client.query(
      'UPDATE projects SET category=$1, type=$2, name=$3, start_date=$4, end_date=$5, os=$6, memory=$7 WHERE id=$8',
      [category, type, name, startDate, endDate, os, memory, id]
    );
    
    await client.query(
      'UPDATE project_details SET java_version=$1, spring_version=$2, react_version=$3, vue_version=$4, tomcat_version=$5, centric_version=$6 WHERE project_id=$7',
      [javaVersion, springVersion, reactVersion, vueVersion, tomcatVersion, centricVersion, id]
    );

    await client.query('COMMIT');
    res.json({ message: '프로젝트가 성공적으로 수정되었습니다.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: '프로젝트 수정 실패', error });
  }
};

// 프로젝트 삭제
export const deleteProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    const client = await sequelize.getQueryInterface().sequelize;
    try {
        await client.query('BEGIN');
        
        const projectRes = await client.query('SELECT author_id FROM projects WHERE id = :id', { replacements: { id } });
        if (projectRes.length === 0) {
            res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
            return;
        }
        const projectAuthorId = projectRes[0].author_id;

        if (currentUserRole !== 'ADMIN' && currentUserId !== projectAuthorId) {
            res.status(403).json({ message: '프로젝트를 삭제할 권한이 없습니다.' });
            return;
        }

        await client.query('DELETE FROM project_details WHERE project_id = :project_id', { replacements: { project_id: id } });
        await client.query('DELETE FROM dev_notes WHERE project_id = :project_id', { replacements: { project_id: id } });
        await client.query('DELETE FROM projects WHERE id = :id', { replacements: { id } });

        await client.query('COMMIT');
        res.json({ message: '프로젝트가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: '프로젝트 삭제 실패', error });
    }
};

// 진행중인 프로젝트 목록 조회
export const getOngoingProjects = async (req: Request, res: Response) => {
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

    try {
        let query = `
            SELECT 
                p.id, 
                p.name, 
                COALESCE(ROUND(AVG(dn.progress)), 0) as progress
            FROM projects p
            LEFT JOIN dev_notes dn ON p.id = dn.project_id
        `;
        const params: (string | number | undefined)[] = [];

        if (currentUserRole !== 'ADMIN') {
            query += ' WHERE p.author_id = $1';
            params.push(currentUserId);
        } else {
            query += ' WHERE 1=1'; // Always true, to allow appending "AND"
        }

        query += `
            AND (p.type = '추가' OR p.type = '신규')
            GROUP BY p.id
            ORDER BY p.start_date DESC
            LIMIT 3
        `;

        const result = await sequelize.query(query, { replacements: params, type: QueryTypes.SELECT });
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: '진행중인 프로젝트 목록 조회 실패', error });
    }
};

// 개발 노트 생성
export const createDevNote = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { content, deadline, status, progress, parent_id, order } = req.body;
    const authorId = req.user?.id;
    const currentUserRole = req.user?.role;

    try {
        const projectRes = await sequelize.query('SELECT author_id FROM projects WHERE id = :project_id', { replacements: { project_id: projectId }, type: QueryTypes.SELECT });
        if (projectRes.length === 0) {
            res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
            return;
        }
        
        const projectAuthorId = projectRes[0].author_id;
        if (currentUserRole !== 'ADMIN' && authorId !== projectAuthorId) {
            res.status(403).json({ message: '이 프로젝트에 요구사항을 추가할 권한이 없습니다.' });
            return;
        }
        
        const result = await sequelize.query(
            'INSERT INTO dev_notes (project_id, content, deadline, status, progress, author_id, parent_id, "order") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            { replacements: [projectId, content, deadline, status, progress, authorId, parent_id, order], type: QueryTypes.INSERT }
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: '개발 노트 생성 실패', error });
    }
};

// 개발 노트 수정
export const updateDevNote = async (req: Request, res: Response) => {
    const { noteId } = req.params;
    const { content, deadline, status, progress } = req.body;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    try {
        const noteRes = await sequelize.query('SELECT author_id FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.SELECT });
        if (noteRes.length === 0) {
            res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
            return;
        }
        const noteAuthorId = noteRes[0].author_id;

        if (currentUserRole !== 'ADMIN' && currentUserId !== noteAuthorId) {
            res.status(403).json({ message: '노트를 수정할 권한이 없습니다.' });
            return;
        }

        const result = await sequelize.query(
            'UPDATE dev_notes SET content=$1, deadline=$2, status=$3, progress=$4 WHERE id=$5 RETURNING *',
            { replacements: [content, deadline, status, progress, noteId], type: QueryTypes.UPDATE }
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: '개발 노트 수정 실패', error });
    }
};

// 개발 노트 삭제
export const deleteDevNote = async (req: Request, res: Response) => {
    const { noteId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    try {
        const noteRes = await sequelize.query('SELECT author_id FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.SELECT });
        if (noteRes.length === 0) {
            res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
            return;
        }
        const noteAuthorId = noteRes[0].author_id;

        if (currentUserRole !== 'ADMIN' && currentUserId !== noteAuthorId) {
            res.status(403).json({ message: '노트를 삭제할 권한이 없습니다.' });
            return;
        }

        await sequelize.query('DELETE FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.DELETE });
        res.json({ message: '개발 노트가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: '개발 노트 삭제 실패', error });
    }
};

// WBS/DevNotes 구조 업데이트를 위한 새 함수
export const updateDevNotesStructure = async (req: Request, res: Response) => {
    const { projectId } = req.params;
    const { structure } = req.body; // [{ id: 1, parent_id: null, order: 0 }, ...]

    const client = await sequelize.getQueryInterface().sequelize;
    try {
        await client.query('BEGIN');

        for (const item of structure) {
            await client.query(
                'UPDATE dev_notes SET parent_id = $1, "order" = $2 WHERE id = $3 AND project_id = $4',
                [item.parent_id, item.order, item.id, projectId]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'DevNotes 구조가 업데이트되었습니다.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('DevNotes 구조 업데이트 오류:', error);
        res.status(500).json({ message: 'DevNotes 구조 업데이트 실패', error });
    }
};

// 특정 노트의 댓글 조회
export const getDevNoteComments = async (req: Request, res: Response) => {
    const { noteId } = req.params;
    try {
        const result = await sequelize.query(
            `SELECT c.*, u.name as "authorName", TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI') as "createdAt"
             FROM dev_note_comments c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.note_id = :note_id
             ORDER BY c.created_at ASC`,
            { replacements: { note_id: noteId }, type: QueryTypes.SELECT }
        );
        res.json(result.rows);
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        res.status(500).json({ message: '댓글을 불러오는데 실패했습니다.' });
    }
};

// 특정 노트에 댓글 생성
export const createDevNoteComment = async (req: Request, res: Response) => {
    const { noteId } = req.params;
    const { content } = req.body;
    const authorId = req.user?.id;

    if (!content) {
        res.status(400).json({ message: '댓글 내용이 필요합니다.' });
        return;
    }

    try {
        const result = await sequelize.query(
            'INSERT INTO dev_note_comments (note_id, author_id, content) VALUES ($1, $2, $3) RETURNING *',
            { replacements: [noteId, authorId, content], type: QueryTypes.INSERT }
        );
        
        // 방금 생성된 댓글 정보를 더 자세히 조회해서 반환
        const newComment = await sequelize.query(
            `SELECT c.*, u.name as "authorName", TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI') as "createdAt"
             FROM dev_note_comments c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.id = $1`,
            { replacements: [result.rows[0].id], type: QueryTypes.SELECT }
        );

        res.status(201).json(newComment.rows[0]);
    } catch (error) {
        console.error('댓글 생성 오류:', error);
        res.status(500).json({ message: '댓글 작성에 실패했습니다.' });
    }
}; 