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

// 한글→영문 변환 함수
function toStatusCode(status: string) {
  if (status === '미결') return 'TODO';
  if (status === '진행중') return 'IN_PROGRESS';
  if (status === '완료') return 'DONE';
  return status;
}
function toTypeCode(type: string) {
  if (type === '신규') return 'NEW';
  if (type === '추가') return 'ADD';
  if (type === '완료') return 'COMPLETE';
  if (type === '실패') return 'FAIL';
  return type;
}
function toCategoryCode(category: string) {
  if (category === 'SI') return 'SI';
  if (category === '센트릭') return 'CENTRIC';
  if (category === '기타') return 'ETC';
  return category;
}

// 프로젝트 목록 조회
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  const currentUserCompany = req.user?.company_code;

  try {
    let query = `
      SELECT id, category, type, name, company_code, TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate", progress
      FROM projects
    `;
    const params: any = {};

    if (currentUserRole === 'MANAGER') {
      query += ' WHERE company_code = :company_code';
      params.company_code = currentUserCompany;
    } else if (currentUserRole !== 'ADMIN') {
      query += ' WHERE author_id = :author_id';
      params.author_id = currentUserId;
    }

    query += ' ORDER BY start_date DESC';
    const projects = await sequelize.query(query, { replacements: params, type: QueryTypes.SELECT });
    res.json(Array.isArray(projects) ? projects : []);
  } catch (error) {
    res.status(500).json({ message: '프로젝트 목록 조회 실패', error });
  }
};

// 프로젝트 상세 조회
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  const currentUserCompany = req.user?.company_code;

  try {
    const rows = await sequelize.query('SELECT *, TO_CHAR(start_date, \'YYYY-MM-DD\') as "startDate", TO_CHAR(end_date, \'YYYY-MM-DD\') as "endDate" FROM projects WHERE id = :id', { replacements: { id }, type: QueryTypes.SELECT });
    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
      return;
    }
    const project = rows[0] as any;

    if (currentUserRole === 'MANAGER' && currentUserCompany !== project.company_code) {
      res.status(403).json({ message: '타 기업 프로젝트 접근 불가' });
      return;
    }
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'MANAGER' && currentUserId !== project.author_id) {
      res.status(403).json({ message: '프로젝트에 접근할 권한이 없습니다.' });
      return;
    }

    const detailsRes = await sequelize.query('SELECT * FROM project_details WHERE project_id = :project_id', { replacements: { project_id: id }, type: QueryTypes.SELECT });
    project.details = Array.isArray(detailsRes) && detailsRes.length > 0 ? detailsRes[0] : {};
    
    const notesRes = await sequelize.query(
      `SELECT dn.*, u.name as "authorName", TO_CHAR(dn.registered_at, 'YYYY-MM-DD') as "registeredAt", TO_CHAR(dn.completed_at, 'YYYY-MM-DD') as "completedAt" 
       FROM dev_notes dn
       LEFT JOIN users u ON dn.author_id = u.id
       WHERE dn.project_id = :project_id ORDER BY dn.registered_at DESC`, 
      { replacements: { project_id: id }, type: QueryTypes.SELECT }
    );
    project.devNotes = Array.isArray(notesRes) ? notesRes : [];

    res.json(project);
    console.log('getProjectById API response (project):', project);
  } catch (error) {
    res.status(500).json({ message: '프로젝트 상세 정보 조회 실패', error });
  }
};

// 프로젝트의 DevNotes를 WBS 형식(트리)으로 조회
export const getDevNotesAsWbs = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  try {
    const notesRes = await sequelize.query(
      `SELECT dn.*, u.name as "authorName", TO_CHAR(dn.registered_at, 'YYYY-MM-DD') as "registeredAt", TO_CHAR(dn.completed_at, 'YYYY-MM-DD') as "completedAt" 
       FROM dev_notes dn
       LEFT JOIN users u ON dn.author_id = u.id
       WHERE dn.project_id = :projectId 
       ORDER BY dn.parent_id, dn."order" ASC`,
      { replacements: { project_id: projectId }, type: QueryTypes.SELECT }
    );
    const tree = buildDevNotesTree(notesRes);
    res.json(tree);
    console.log('getDevNotesAsWbs API response (tree):', tree);
  } catch (error) {
    console.error('WBS(DevNotes) 조회 오류:', error);
    res.status(500).json({ message: 'WBS(DevNotes) 조회 실패', error });
  }
};

// 프로젝트 상태별 개수 조회
export const getProjectStatusSummary = async (req: Request, res: Response): Promise<void> => {
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
export const createProject = async (req: Request, res: Response): Promise<void> => {
  const category = toCategoryCode(req.body.category);
  const type = toTypeCode(req.body.type);
  const { name, startDate, endDate, os, memory, javaVersion, springVersion, reactVersion, vueVersion, tomcatVersion, centricVersion } = req.body;
  const authorId = req.user?.id;
  const companyCode = req.user?.company_code;
  const safe = (v: string) => (v === '' ? null : v);
  console.log('[createProject] req.user:', req.user);
  console.log('[createProject] req.body:', req.body);
  if (!authorId) {
    console.log('[createProject] authorId is missing!');
    res.status(401).json({ message: '로그인 정보가 필요합니다.' });
    return;
  }
  if (!category || !type || !name || !startDate || !endDate) {
    console.log('[createProject] 필수값 누락:', { category, type, name, startDate, endDate });
    res.status(400).json({ message: '필수값 누락' });
    return;
  }
  try {
    console.log('[createProject] Inserting project:', { category, type, name, startDate, endDate, os, memory, authorId, companyCode });
    await sequelize.query('BEGIN');
    const [rows] = await sequelize.query(
      'INSERT INTO projects (category, type, name, start_date, end_date, os, memory, author_id, company_code) VALUES (:category, :type, :name, :startDate, :endDate, :os, :memory, :authorId, :companyCode) RETURNING id',
      { replacements: { category, type, name, startDate, endDate, os: safe(os), memory: safe(memory), authorId, companyCode }, type: QueryTypes.SELECT }
    );
    const projectId = Array.isArray(rows) ? (rows[0] as any)?.id : (rows as any)?.id;
    if (!projectId) {
      await sequelize.query('ROLLBACK');
      console.log('[createProject] 프로젝트 생성 실패(DB insert 결과 없음, rows:', rows, ')');
      throw new Error('DB insert 결과 없음');
    }
    await sequelize.query(
      'INSERT INTO project_details (project_id, java_version, spring_version, react_version, vue_version, tomcat_version, centric_version) VALUES (:projectId, :javaVersion, :springVersion, :reactVersion, :vueVersion, :tomcatVersion, :centricVersion)',
      { replacements: { projectId, javaVersion: safe(javaVersion), springVersion: safe(springVersion), reactVersion: safe(reactVersion), vueVersion: safe(vueVersion), tomcatVersion: safe(tomcatVersion), centricVersion: safe(centricVersion) }, type: QueryTypes.INSERT }
    );
    await sequelize.query('COMMIT');
    console.log('[createProject] 프로젝트 생성 성공:', projectId);
    res.status(201).json({ id: projectId, message: '프로젝트가 성공적으로 생성되었습니다.' });
    return;
  } catch (error) {
    await sequelize.query('ROLLBACK');
    try {
      console.log('[createProject] 프로젝트 생성 중 예외 발생:', error, JSON.stringify(error));
    } catch (e) {
      console.log('[createProject] 프로젝트 생성 중 예외 발생(직렬화 불가):', error);
    }
    res.status(500).json({ message: '프로젝트 생성 실패', error });
    return;
  }
};

// 프로젝트 수정
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  // 한글→영문 변환 적용
  const category = toCategoryCode(req.body.category);
  const type = toTypeCode(req.body.type);
  const { name, startDate, endDate, os, memory, javaVersion, springVersion, reactVersion, vueVersion, tomcatVersion, centricVersion } = req.body;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  try {
    await sequelize.query('BEGIN');
    const [rows] = await sequelize.query('SELECT author_id FROM projects WHERE id = :id', { replacements: { id }, type: QueryTypes.SELECT });
    let projectAuthorId = null;
    if (Array.isArray(rows) && rows.length > 0) {
      projectAuthorId = rows[0].author_id;
    } else if (rows && typeof rows === 'object' && 'author_id' in rows) {
      projectAuthorId = rows.author_id;
    } else {
      await sequelize.query('ROLLBACK');
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.', rows });
      return;
    }
    if (currentUserRole !== 'ADMIN' && currentUserId !== projectAuthorId) {
      await sequelize.query('ROLLBACK');
      res.status(403).json({ message: '프로젝트를 수정할 권한이 없습니다.' });
      return;
    }
    await sequelize.query(
      'UPDATE projects SET category=:category, type=:type, name=:name, start_date=:startDate, end_date=:endDate, os=:os, memory=:memory WHERE id=:id',
      { replacements: { category, type, name, startDate, endDate, os, memory, id }, type: QueryTypes.UPDATE }
    );
    await sequelize.query(
      'UPDATE project_details SET java_version=:javaVersion, spring_version=:springVersion, react_version=:reactVersion, vue_version=:vueVersion, tomcat_version=:tomcatVersion, centric_version=:centricVersion WHERE project_id=:id',
      { replacements: { javaVersion, springVersion, reactVersion, vueVersion, tomcatVersion, centricVersion, id }, type: QueryTypes.UPDATE }
    );
    await sequelize.query('COMMIT');
    res.json({ message: '프로젝트가 성공적으로 수정되었습니다.' });
  } catch (error) {
    await sequelize.query('ROLLBACK');
    res.status(500).json({ message: '프로젝트 수정 실패', error });
  }
};

// 프로젝트 삭제
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  try {
    await sequelize.query('BEGIN');
    const [rows] = await sequelize.query('SELECT author_id FROM projects WHERE id = :id', { replacements: { id }, type: QueryTypes.SELECT });
    let projectAuthorId = null;
    if (Array.isArray(rows) && rows.length > 0) {
      projectAuthorId = rows[0].author_id;
    } else if (rows && typeof rows === 'object' && 'author_id' in rows) {
      projectAuthorId = rows.author_id;
    } else {
      await sequelize.query('ROLLBACK');
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.', rows });
      return;
    }
    if (currentUserRole !== 'ADMIN' && currentUserId !== projectAuthorId) {
      await sequelize.query('ROLLBACK');
      res.status(403).json({ message: '프로젝트를 삭제할 권한이 없습니다.' });
      return;
    }
    await sequelize.query('DELETE FROM project_details WHERE project_id = :project_id', { replacements: { project_id: id }, type: QueryTypes.DELETE });
    await sequelize.query('DELETE FROM dev_notes WHERE project_id = :project_id', { replacements: { project_id: id }, type: QueryTypes.DELETE });
    await sequelize.query('DELETE FROM projects WHERE id = :id', { replacements: { id }, type: QueryTypes.DELETE });
    await sequelize.query('COMMIT');
    res.json({ message: '프로젝트가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    await sequelize.query('ROLLBACK');
    res.status(500).json({ message: '프로젝트 삭제 실패', error });
  }
};

// 진행중인 프로젝트 목록 조회
export const getOngoingProjects = async (req: Request, res: Response): Promise<void> => {
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
        return;
    } catch (error) {
        res.status(500).json({ message: '진행중인 프로젝트 목록 조회 실패', error });
        return;
    }
};

// 개발 노트 생성
export const createDevNote = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const status = toStatusCode(req.body.status);
  const { content, deadline, progress, completedAt } = req.body;
  const authorId = req.user?.id;
  const currentUserRole = req.user?.role;
  try {
    console.log('[createDevNote] req.user:', req.user);
    console.log('[createDevNote] req.body:', req.body);
    console.log('[createDevNote] params:', req.params);

    const [projectRows] = await sequelize.query('SELECT author_id FROM projects WHERE id = :project_id', { replacements: { project_id: projectId }, type: QueryTypes.SELECT });
    console.log('[createDevNote] projectRows:', projectRows);

    // projectRows가 배열이 아니어도 author_id가 있으면 통과
    let projectAuthorId = null;
    if (Array.isArray(projectRows) && projectRows.length > 0) {
      projectAuthorId = projectRows[0].author_id;
    } else if (projectRows && typeof projectRows === 'object' && 'author_id' in projectRows) {
      projectAuthorId = projectRows.author_id;
    } else {
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.', projectRows });
      return;
    }

    if (currentUserRole !== 'ADMIN' && authorId !== projectAuthorId) {
      res.status(403).json({ message: '이 프로젝트에 요구사항을 추가할 권한이 없습니다.' });
      return;
    }
    console.log('[createDevNote] Inserting dev_note:', { projectId, content, deadline, status, progress, authorId, parent_id, order });

    const [rows] = await sequelize.query(
      'INSERT INTO dev_notes (project_id, content, deadline, status, progress, author_id, parent_id, "order", completed_at) VALUES (:projectId, :content, :deadline, :status, :progress, :authorId, :parent_id, :order, :completedAt) RETURNING *',
      { replacements: { projectId, content, deadline, status, progress, authorId, parent_id: parent_id ?? null, order: order ?? null, completedAt: completedAt ?? null }, type: QueryTypes.SELECT }
    );
    console.log('[createDevNote] Insert result rows:', rows);

    let note = null;
    if (Array.isArray(rows)) {
      note = rows[0];
    } else if (rows && typeof rows === 'object' && 'id' in rows) {
      note = rows;
    }
    if (!note) {
      res.status(500).json({ message: '노트 생성 결과가 올바르지 않습니다.', rows });
      return;
    }
    res.status(201).json(note);
    return;
  } catch (error) {
    const err = error as any;
    console.error('[createDevNote] error:', err, 'stack:', err?.stack);
    res.status(500).json({ message: '개발 노트 생성 실패', error: JSON.stringify(error) });
    return;
  }
};

// 개발 노트 수정
export const updateDevNote = async (req: Request, res: Response): Promise<void> => {
  const { noteId } = req.params;
  // 한글→영문 변환 적용
  const status = toStatusCode(req.body.status);
  const { content, deadline, progress, completedAt } = req.body;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  try {
    const [noteRows] = await sequelize.query('SELECT author_id FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.SELECT });
    let noteAuthorId = null;
    if (Array.isArray(noteRows) && noteRows.length > 0) {
      noteAuthorId = noteRows[0].author_id;
    } else if (noteRows && typeof noteRows === 'object' && 'author_id' in noteRows) {
      noteAuthorId = noteRows.author_id;
    } else {
      res.status(404).json({ message: '노트를 찾을 수 없습니다.', noteRows });
      return;
    }
    if (currentUserRole !== 'ADMIN' && currentUserId !== noteAuthorId) {
      res.status(403).json({ message: '노트를 수정할 권한이 없습니다.' });
      return;
    }
    const [rows] = await sequelize.query(
      'UPDATE dev_notes SET content=:content, deadline=:deadline, status=:status, progress=:progress, completed_at=:completedAt WHERE id=:noteId RETURNING *',
      { replacements: { content, deadline, status, progress, completedAt, noteId }, type: QueryTypes.SELECT }
    );
    res.json((rows as any[])[0]);
  } catch (error) {
    res.status(500).json({ message: '개발 노트 수정 실패', error });
  }
};

// 개발 노트 삭제
export const deleteDevNote = async (req: Request, res: Response): Promise<void> => {
  const { noteId } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  try {
    const [noteRows] = await sequelize.query('SELECT author_id FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.SELECT });
    let noteAuthorId = null;
    if (Array.isArray(noteRows) && noteRows.length > 0) {
      noteAuthorId = noteRows[0].author_id;
    } else if (noteRows && typeof noteRows === 'object' && 'author_id' in noteRows) {
      noteAuthorId = noteRows.author_id;
    } else {
      res.status(404).json({ message: '노트를 찾을 수 없습니다.', noteRows });
      return;
    }
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
export const updateDevNotesStructure = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { structure } = req.body; // [{ id: 1, parent_id: null, order: 0 }, ...]
  try {
    await sequelize.query('BEGIN');
    for (const item of structure) {
      await sequelize.query(
        'UPDATE dev_notes SET parent_id = :parent_id, "order" = :order WHERE id = :id AND project_id = :project_id',
        { replacements: { parent_id: item.parent_id, order: item.order, id: item.id, project_id: projectId }, type: QueryTypes.UPDATE }
      );
    }
    await sequelize.query('COMMIT');
    res.json({ message: 'DevNotes 구조가 업데이트되었습니다.' });
  } catch (error) {
    await sequelize.query('ROLLBACK');
    console.error('DevNotes 구조 업데이트 오류:', error);
    res.status(500).json({ message: 'DevNotes 구조 업데이트 실패', error });
  }
};

// 특정 노트의 댓글 조회
export const getDevNoteComments = async (req: Request, res: Response): Promise<void> => {
  const { noteId } = req.params;
  try {
    const result = await sequelize.query(
      `SELECT c.*, u.name as "authorName", TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI') as "createdAt"
       FROM dev_note_comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.note_id = :noteId
       ORDER BY c.created_at ASC`,
      { replacements: { noteId }, type: QueryTypes.SELECT }
    );
    // sequelize.query 결과가 이중 배열일 수 있으므로 flat()으로 처리
    const comments = Array.isArray(result) ? result.flat() : [];
    res.json(comments);
  } catch (error) {
    console.error('댓글 조회 실패:', error);
    res.status(500).json({ message: '댓글 조회 실패', error });
  }
};

// 댓글 생성
export const createDevNoteComment = async (req: Request, res: Response): Promise<void> => {
  const { noteId } = req.params;
  const { content } = req.body;
  const authorId = req.user?.id;
  try {
    const [comment] = await sequelize.query(
      'INSERT INTO dev_note_comments (note_id, author_id, content) VALUES (:noteId, :authorId, :content) RETURNING *',
      { replacements: { noteId, authorId, content }, type: QueryTypes.SELECT }
    );
    // 반환값 구조 유연하게 처리
    if (!comment) {
      res.status(500).json({ message: '댓글 생성 결과가 올바르지 않습니다.' });
      return;
    }
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: '댓글 생성 실패', error });
  }
};

// 프로젝트에 할당된 회원 목록 조회
export const getProjectAssignees = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const rows = await sequelize.query(
      `SELECT u.id, u.name, u.email, d.department_name FROM project_assignees pa
       JOIN users u ON pa.user_id = u.id
       LEFT JOIN departments d ON u.department = d.id
       WHERE pa.project_id = :project_id`,
      { replacements: { project_id: id }, type: QueryTypes.SELECT }
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    res.status(500).json({ message: '할당된 회원 조회 실패', error });
  }
};

// 프로젝트에 회원 할당
export const assignUserToProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ message: 'userId가 필요합니다.' });
    return;
  }
  try {
    await sequelize.query(
      `INSERT INTO project_assignees (project_id, user_id) VALUES (:project_id, :user_id)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      { replacements: { project_id: id, user_id: userId }, type: QueryTypes.INSERT }
    );
    res.json({ message: '회원이 프로젝트에 할당되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '회원 할당 실패', error });
  }
};

// 요구사항(DevNote)에 할당된 회원 목록 조회
export const getDevNoteAssignees = async (req: Request, res: Response) => {
  const { noteId } = req.params;
  try {
    const rows = await sequelize.query(
      `SELECT u.id, d.department_name FROM devnote_assignees da
       JOIN users u ON da.user_id = u.id
       LEFT JOIN departments d ON u.department = d.id
       WHERE da.devnote_id = :devnote_id`,
      { replacements: { devnote_id: noteId }, type: QueryTypes.SELECT }
    );
    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    res.status(500).json({ message: '요구사항 담당자 조회 실패', error });
  }
};

// 요구사항(DevNote)에 회원 할당
export const assignUserToDevNote = async (req: Request, res: Response) => {
  const { noteId } = req.params;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ message: 'userId가 필요합니다.' });
    return;
  }
  try {
    await sequelize.query(
      `INSERT INTO devnote_assignees (devnote_id, user_id) VALUES (:devnote_id, :user_id)
       ON CONFLICT (devnote_id, user_id) DO NOTHING`,
      { replacements: { devnote_id: noteId, user_id: userId }, type: QueryTypes.INSERT }
    );
    res.json({ message: '회원이 요구사항에 할당되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '요구사항 담당자 할당 실패', error });
  }
}; 