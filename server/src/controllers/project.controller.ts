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

// 프로젝트 자동 완료 체크 함수
async function checkAndUpdateProjectCompletion(projectId: number): Promise<void> {
  try {
    // 프로젝트의 모든 요구사항 조회
    const allNotesQuery = `
      SELECT COUNT(*) as total_count,
             COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed_count
      FROM dev_notes 
      WHERE project_id = :projectId
    `;
    
    const result = await sequelize.query(allNotesQuery, { 
      replacements: { projectId }, 
      type: QueryTypes.SELECT 
    });
    
    const stats = (result as any[])[0];
    const totalCount = parseInt(stats.total_count);
    const completedCount = parseInt(stats.completed_count);
    
    console.log(`📊 프로젝트 ${projectId} 요구사항 현황: ${completedCount}/${totalCount} 완료`);
    
    // 요구사항이 1개 이상 있고 모두 완료된 경우
    if (totalCount > 0 && completedCount === totalCount) {
      // 프로젝트 타입을 '완료'로 변경
      await sequelize.query(
        `UPDATE projects SET type = 'COMPLETE' WHERE id = :projectId AND type != 'COMPLETE'`,
        { replacements: { projectId }, type: QueryTypes.UPDATE }
      );
      
      console.log(`✅ 프로젝트 ${projectId}가 자동으로 완료 상태로 변경되었습니다.`);
    }
  } catch (error) {
    console.error('프로젝트 자동 완료 체크 실패:', error);
  }
}

// 프로젝트 목록 조회
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  const currentUserCompany = req.user?.company_code;

  try {
    console.log('📁 [getProjects] 요청 - 사용자:', currentUserId, '권한:', currentUserRole, '회사:', currentUserCompany);
    
    let query = `
      SELECT p.id, p.category, p.type, p.name, p.company_code, 
             TO_CHAR(p.start_date, 'YYYY-MM-DD') as "startDate", 
             TO_CHAR(p.end_date, 'YYYY-MM-DD') as "endDate", p.progress
      FROM projects p
      LEFT JOIN project_assignees pa ON p.id = pa.project_id
    `;
    const params: any = {};

    // 권한에 따른 프로젝트 필터링
    if (currentUserRole === 'MANAGER') {
      // 매니저: 자신의 회사 프로젝트만
      query += ' WHERE p.company_code = :company_code';
      params.company_code = currentUserCompany;
    } else if (currentUserRole !== 'ADMIN') {
      // 일반 사용자: 본인이 작성한 프로젝트 OR 할당된 프로젝트
      query += ' WHERE (p.author_id = :author_id OR pa.user_id = :user_id)';
      params.author_id = currentUserId;
      params.user_id = currentUserId;
    }
    // ADMIN은 모든 프로젝트 조회 가능

    query += ' GROUP BY p.id, p.category, p.type, p.name, p.company_code, p.start_date, p.end_date, p.progress ORDER BY p.start_date DESC';
    
    console.log('📁 [getProjects] 실행 쿼리:', query);
    console.log('📁 [getProjects] 쿼리 파라미터:', params);
    
    const projects = await sequelize.query(query, { replacements: params, type: QueryTypes.SELECT });
    
    console.log('📁 [getProjects] 결과 개수:', Array.isArray(projects) ? projects.length : 0);
    console.log('📁 [getProjects] 결과:', projects);
    
    res.json(Array.isArray(projects) ? projects : []);
  } catch (error) {
    console.error('📁 [getProjects] 에러:', error);
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

    // 권한 체크
    if (currentUserRole === 'MANAGER' && currentUserCompany !== project.company_code) {
      res.status(403).json({ message: '타 기업 프로젝트 접근 불가' });
      return;
    }
    
    // 일반 사용자 권한 체크: 프로젝트 작성자 OR 할당된 회원
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'MANAGER') {
      const isAuthor = currentUserId === project.author_id;
      
      // 할당된 회원인지 확인
      const assigneeCheck = await sequelize.query(
        'SELECT 1 FROM project_assignees WHERE project_id = :project_id AND user_id = :user_id',
        { replacements: { project_id: id, user_id: currentUserId }, type: QueryTypes.SELECT }
      );
      const isAssigned = Array.isArray(assigneeCheck) && assigneeCheck.length > 0;
      
      if (!isAuthor && !isAssigned) {
        res.status(403).json({ message: '프로젝트에 접근할 권한이 없습니다.' });
        return;
      }
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
  } catch (error) {
    console.error('프로젝트 상세 조회 에러:', error);
    res.status(500).json({ message: '프로젝트 상세 조회 실패', error });
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
      { replacements: { projectId: projectId }, type: QueryTypes.SELECT }
    );
    console.log('Raw notes from DB:', notesRes); // 추가할 로그
    const tree = buildDevNotesTree(notesRes);
    console.log('Built WBS tree:', tree); // 추가할 로그
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
    console.log('📊 [getProjectStatusSummary] 요청 - 사용자:', currentUserId, '권한:', currentUserRole);
    
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

    // 권한에 따른 프로젝트 필터링
    if (currentUserRole === 'MANAGER') {
      // 매니저: 자신의 회사 프로젝트만
      query += ' WHERE company_code = :company_code';
      params.company_code = req.user?.company_code;
    } else if (currentUserRole !== 'ADMIN') {
      // 일반 사용자: 본인이 작성한 프로젝트 OR 할당된 프로젝트만
      query = `
        SELECT
          CASE
            WHEN progress = 0 THEN '미완료'
            WHEN progress >= 100 THEN '완료'
            ELSE '진행중'
          END as status,
          COUNT(DISTINCT p.id)::int as count
        FROM projects p
        LEFT JOIN project_assignees pa ON p.id = pa.project_id
        WHERE (p.author_id = :author_id OR pa.user_id = :user_id)
      `;
      params.author_id = currentUserId;
      params.user_id = currentUserId;
    }
    // ADMIN은 모든 프로젝트 조회 가능

    query += ' GROUP BY status';

    console.log('📊 [getProjectStatusSummary] 실행 쿼리:', query);
    console.log('📊 [getProjectStatusSummary] 쿼리 파라미터:', params);

    const result = await sequelize.query(query, { replacements: params, type: QueryTypes.SELECT });
    
    console.log('📊 [getProjectStatusSummary] 결과:', result);
    
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
            LEFT JOIN project_assignees pa ON p.id = pa.project_id
        `;
        const params: any = {};

        if (currentUserRole !== 'ADMIN') {
            // 일반 사용자: 본인이 작성한 프로젝트 OR 할당된 프로젝트
            query += ' WHERE (p.author_id = :currentUserId OR pa.user_id = :currentUserId)';
            params.currentUserId = currentUserId;
        } else {
            query += ' WHERE 1=1'; // Always true, to allow appending "AND"
        }

        query += `
            AND (p.type = '추가' OR p.type = '신규')
            GROUP BY p.id, p.name, p.start_date
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
  const authorId = req.user?.id;
  const currentUserRole = req.user?.role;
  try {
    const { projectId } = req.params;
    const status = toStatusCode(req.body.status);
    const { content, deadline, progress, completedAt, parent_id, order } = req.body;
      console.log('[createDevNote] req.body:', req.body);
      console.log('[createDevNote] params:', req.params);

      const projectRows = await sequelize.query('SELECT author_id FROM projects WHERE id = :project_id', { replacements: { project_id: projectId }, type: QueryTypes.SELECT });
      console.log('[createDevNote] projectRows:', projectRows);

      // projectRows가 배열이 아니어도 author_id가 있으면 통과
      let projectAuthorId = null;
      if (Array.isArray(projectRows) && projectRows.length > 0) {
        projectAuthorId = (projectRows[0] as any).author_id;
      } else {
        res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        return;
      }

      if (currentUserRole !== 'ADMIN' && authorId !== projectAuthorId) {
        res.status(403).json({ message: '이 프로젝트에 요구사항을 추가할 권한이 없습니다.' });
        return;
      }
      console.log('[createDevNote] Inserting dev_note:', { projectId, content, deadline, status, progress, authorId, parent_id, order });

      const rows = await sequelize.query(
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
  } 
  catch (error) {
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
  const { content, deadline, progress } = req.body;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  let completedAt = req.body.completedAt; // 기존 completedAt 값 유지 (수동 입력 시)

  // 상태가 '완료'로 변경되거나 진행률이 100%일 때 completedAt을 현재 시간으로 설정
  if (status === 'DONE' || progress === 100) {
    completedAt = new Date().toISOString(); // ISO 8601 형식으로 현재 시간 설정
  } else if (status !== 'DONE' && progress !== 100) {
    completedAt = null; // 완료 상태가 아니고 진행률도 100%가 아니면 completedAt을 null로 설정
  }

  try {
    const noteRows = await sequelize.query('SELECT author_id FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.SELECT });
    let noteAuthorId = null;
    if (Array.isArray(noteRows) && noteRows.length > 0) {
      noteAuthorId = (noteRows[0] as any).author_id;
    } else {
      res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
      return;
    }
    if (currentUserRole !== 'ADMIN' && currentUserId !== noteAuthorId) {
      res.status(403).json({ message: '노트를 수정할 권한이 없습니다.' });
      return;
    }

    // 동적으로 UPDATE 쿼리 생성 (전달된 필드만 업데이트)
    const updateFields = [];
    const replacements: any = { noteId };

    if (content !== undefined) {
      updateFields.push('content = :content');
      replacements.content = content;
    }
    if (deadline !== undefined) {
      updateFields.push('deadline = :deadline');
      replacements.deadline = deadline;
    }
    if (status !== undefined) {
      updateFields.push('status = :status');
      replacements.status = status;
    }
    if (progress !== undefined) {
      updateFields.push('progress = :progress');
      replacements.progress = progress;
    }
    if (completedAt !== undefined) {
      updateFields.push('completed_at = :completedAt');
      replacements.completedAt = completedAt;
    }

    if (updateFields.length === 0) {
      res.status(400).json({ message: '업데이트할 필드가 없습니다.' });
      return;
    }

    const updateQuery = `UPDATE dev_notes SET ${updateFields.join(', ')} WHERE id = :noteId RETURNING *`;
    const rows = await sequelize.query(updateQuery, { replacements, type: QueryTypes.SELECT });
    
    // 업데이트된 노트에 authorName과 registeredAt 추가
    const updatedNote = (rows as any[])[0];
    if (updatedNote) {
      const noteWithDetails = await sequelize.query(
        `SELECT dn.*, u.name as "authorName", TO_CHAR(dn.registered_at, 'YYYY-MM-DD') as "registeredAt", TO_CHAR(dn.completed_at, 'YYYY-MM-DD') as "completedAt"
         FROM dev_notes dn
         LEFT JOIN users u ON dn.author_id = u.id
         WHERE dn.id = :noteId`,
        { replacements: { noteId }, type: QueryTypes.SELECT }
      );

      // 요구사항이 완료되었을 때 프로젝트 자동 완료 체크
      if (status === 'DONE' || progress === 100) {
        await checkAndUpdateProjectCompletion(updatedNote.project_id);
      }
      
      res.json((noteWithDetails as any[])[0]);
    } else {
      res.status(404).json({ message: '업데이트된 노트를 찾을 수 없습니다.' });
    }
  } catch (error) {
    console.error('개발 노트 수정 실패:', error);
    res.status(500).json({ message: '개발 노트 수정 실패', error });
  }
};

// 개발 노트 삭제
export const deleteDevNote = async (req: Request, res: Response): Promise<void> => {
  const { noteId } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;
  try {
    const noteRows = await sequelize.query('SELECT author_id FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.SELECT });
    let noteAuthorId = null;
    if (Array.isArray(noteRows) && noteRows.length > 0) {
      noteAuthorId = (noteRows[0] as any).author_id;
    } else {
      res.status(404).json({ message: '노트를 찾을 수 없습니다.' });
      return;
    }
    if (currentUserRole !== 'ADMIN' && currentUserId !== noteAuthorId) {
      res.status(403).json({ message: '노트를 삭제할 권한이 없습니다.' });
      return;
    }
    await sequelize.query('DELETE FROM dev_notes WHERE id = :note_id', { replacements: { note_id: noteId }, type: QueryTypes.DELETE });
    res.json({ message: '개발 노트가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('개발 노트 삭제 실패:', error);
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

// AI 생성 WBS를 일괄 저장하는 함수
export const bulkCreateDevNotes = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { notes } = req.body; // notes는 WBS 항목 배열 [{ content, deadline, parent_id, order }, ...]
  const authorId = req.user?.id;
  const currentUserRole = req.user?.role;

  if (!Array.isArray(notes) || notes.length === 0) {
    res.status(400).json({ message: '저장할 WBS 항목이 없습니다.' });
    return;
  }

  if (!authorId) {
    res.status(401).json({ message: '로그인 정보가 필요합니다.' });
    return;
  }

  try {
    // 프로젝트 소유권 확인 (기존 createDevNote 로직 참고)
    const projectRows = await sequelize.query('SELECT author_id FROM projects WHERE id = :project_id', { replacements: { project_id: projectId }, type: QueryTypes.SELECT });
    let projectAuthorId = null;
    if (Array.isArray(projectRows) && projectRows.length > 0) {
      projectAuthorId = (projectRows[0] as any).author_id;
    } else {
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
      return;
    }

    if (currentUserRole !== 'ADMIN' && authorId !== projectAuthorId) {
      res.status(403).json({ message: '이 프로젝트에 요구사항을 추가할 권한이 없습니다.' });
      return;
    }

    await sequelize.query('BEGIN'); // 트랜잭션 시작

    for (const note of notes) {
      const { content, deadline, parent_id, order } = note;
      const status = 'TODO'; // AI 생성 시 기본 상태는 'TODO'
      const progress = 0; // AI 생성 시 기본 진행률은 0
      const completedAt = null; // AI 생성 시 완료일은 null

      await sequelize.query(
        'INSERT INTO dev_notes (project_id, content, deadline, status, progress, author_id, parent_id, "order", completed_at) VALUES (:projectId, :content, :deadline, :status, :progress, :authorId, :parent_id, :order, :completedAt)',
        {
          replacements: {
            projectId,
            content,
            deadline: deadline ?? null,
            status,
            progress,
            authorId,
            parent_id: parent_id ?? null,
            order: order ?? 0, // order가 없으면 0으로 기본값 설정
            completedAt
          },
          type: QueryTypes.INSERT
        }
      );
    }

    await sequelize.query('COMMIT'); // 트랜잭션 커밋
    res.status(201).json({ message: 'WBS 항목들이 성공적으로 생성되었습니다.' });
  } catch (error) {
    await sequelize.query('ROLLBACK'); // 오류 발생 시 롤백
    console.error('WBS 항목 일괄 생성 오류:', error);
    res.status(500).json({ message: 'WBS 항목 일괄 생성 실패', error });
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
      `SELECT u.id, u.name, u.email, d.department_name, pa.role, pa.assigned_at 
       FROM project_assignees pa
       JOIN users u ON pa.user_id = u.id
       LEFT JOIN departments d ON u.department = d.id
       WHERE pa.project_id = :project_id
       ORDER BY 
         CASE pa.role 
           WHEN 'PL' THEN 1
           WHEN 'PLANNER' THEN 2
           WHEN 'DESIGNER' THEN 3
           WHEN 'DEVELOPER' THEN 4
           ELSE 5
         END, pa.assigned_at`,
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
  const { userId, role = 'MEMBER' } = req.body;
  if (!userId) {
    res.status(400).json({ message: 'userId가 필요합니다.' });
    return;
  }
  
  const validRoles = ['PL', 'PLANNER', 'DESIGNER', 'DEVELOPER', 'MEMBER'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ message: '유효하지 않은 역할입니다.' });
    return;
  }
  
  try {
    // PL 역할인 경우 기존 PL이 있는지 확인
    if (role === 'PL') {
      const existingPL = await sequelize.query(
        `SELECT user_id FROM project_assignees WHERE project_id = :project_id AND role = 'PL'`,
        { replacements: { project_id: id }, type: QueryTypes.SELECT }
      );
      if (Array.isArray(existingPL) && existingPL.length > 0) {
        res.status(400).json({ message: '이미 PL이 할당되어 있습니다.' });
        return;
      }
    }
    
    await sequelize.query(
      `INSERT INTO project_assignees (project_id, user_id, role) VALUES (:project_id, :user_id, :role)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = :role`,
      { replacements: { project_id: id, user_id: userId, role }, type: QueryTypes.INSERT }
    );
    res.json({ message: `회원이 프로젝트에 ${role} 역할로 할당되었습니다.` });
  } catch (error) {
    res.status(500).json({ message: '회원 할당 실패', error });
  }
};

// 요구사항(DevNote)에 할당된 회원 목록 조회
export const getDevNoteAssignees = async (req: Request, res: Response) => {
  const { noteId } = req.params;
  try {
    const rows = await sequelize.query(
      `SELECT u.id, u.name, u.email, d.department_name, da.role, da.assigned_at 
       FROM devnote_assignees da
       JOIN users u ON da.user_id = u.id
       LEFT JOIN departments d ON u.department = d.id
       WHERE da.devnote_id = :devnote_id
       ORDER BY 
         CASE da.role 
           WHEN 'PL' THEN 1
           WHEN 'PLANNER' THEN 2
           WHEN 'DESIGNER' THEN 3
           WHEN 'DEVELOPER' THEN 4
           ELSE 5
         END, da.assigned_at`,
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
  const { userId, role = 'DEVELOPER' } = req.body;
  if (!userId) {
    res.status(400).json({ message: 'userId가 필요합니다.' });
    return;
  }
  
  const validRoles = ['PL', 'PLANNER', 'DESIGNER', 'DEVELOPER'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ message: '유효하지 않은 역할입니다.' });
    return;
  }
  
  try {
    // 해당 역할이 이미 할당되어 있는지 확인
    const existingAssignee = await sequelize.query(
      `SELECT user_id FROM devnote_assignees WHERE devnote_id = :devnote_id AND role = :role`,
      { replacements: { devnote_id: noteId, role }, type: QueryTypes.SELECT }
    );
    
    if (Array.isArray(existingAssignee) && existingAssignee.length > 0) {
      // 기존 할당자를 새로운 할당자로 교체
      await sequelize.query(
        `UPDATE devnote_assignees SET user_id = :user_id, assigned_at = NOW() 
         WHERE devnote_id = :devnote_id AND role = :role`,
        { replacements: { devnote_id: noteId, user_id: userId, role }, type: QueryTypes.UPDATE }
      );
    } else {
      // 새로운 할당 추가
      await sequelize.query(
        `INSERT INTO devnote_assignees (devnote_id, user_id, role) VALUES (:devnote_id, :user_id, :role)`,
        { replacements: { devnote_id: noteId, user_id: userId, role }, type: QueryTypes.INSERT }
      );
    }
    
    res.json({ message: `회원이 요구사항에 ${role} 역할로 할당되었습니다.` });
  } catch (error) {
    res.status(500).json({ message: '요구사항 담당자 할당 실패', error });
  }
};

// 프로젝트 할당 해제
export const removeUserFromProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ message: 'userId가 필요합니다.' });
    return;
  }
  try {
    await sequelize.query(
      `DELETE FROM project_assignees WHERE project_id = :project_id AND user_id = :user_id`,
      { replacements: { project_id: id, user_id: userId }, type: QueryTypes.DELETE }
    );
    res.json({ message: '프로젝트 할당이 해제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '프로젝트 할당 해제 실패', error });
  }
};

// 요구사항 할당 해제
export const removeUserFromDevNote = async (req: Request, res: Response) => {
  const { noteId } = req.params;
  const { userId, role } = req.body;
  if (!userId) {
    res.status(400).json({ message: 'userId가 필요합니다.' });
    return;
  }
  try {
    let query = `DELETE FROM devnote_assignees WHERE devnote_id = :devnote_id AND user_id = :user_id`;
    let replacements: any = { devnote_id: noteId, user_id: userId };
    
    if (role) {
      query += ` AND role = :role`;
      replacements.role = role;
    }
    
    await sequelize.query(query, { replacements, type: QueryTypes.DELETE });
    res.json({ message: '요구사항 할당이 해제되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '요구사항 할당 해제 실패', error });
  }
};

// 프로젝트의 모든 WBS(DevNotes) 삭제
export const clearProjectWbs = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  if (!currentUserId) {
    res.status(401).json({ message: '로그인 정보가 필요합니다.' });
    return;
  }

  try {
    // 프로젝트 소유권 확인
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
        currentUserId !== project.author_id && 
        !(currentUserRole === 'MANAGER' && req.user?.company_code === project.company_code)) {
      res.status(403).json({ message: '이 프로젝트의 WBS를 삭제할 권한이 없습니다.' });
      return;
    }

    await sequelize.query('BEGIN'); // 트랜잭션 시작

    try {
      // 프로젝트의 모든 dev_notes 삭제
      const deleteResult = await sequelize.query(
        'DELETE FROM dev_notes WHERE project_id = :project_id',
        { replacements: { project_id: projectId }, type: QueryTypes.DELETE }
      );

      await sequelize.query('COMMIT'); // 트랜잭션 커밋

      console.log(`프로젝트 ${projectId}의 WBS 전체 삭제 완료`);
      res.json({ 
        message: '프로젝트의 모든 WBS 항목이 삭제되었습니다.',
        deletedCount: Array.isArray(deleteResult) ? deleteResult.length : 0
      });

    } catch (dbError) {
      await sequelize.query('ROLLBACK'); // 오류 발생 시 롤백
      throw dbError;
    }

  } catch (error) {
    console.error('WBS 전체 삭제 오류:', error);
    res.status(500).json({ message: 'WBS 전체 삭제에 실패했습니다.', error });
  }
};

// 프로젝트 결과물 파일 생성
export const generateProjectFile = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { projectData, requirements } = req.body;
  
  try {
    // 프로젝트 데이터 검증
    if (!projectData || !requirements) {
      res.status(400).json({ message: '프로젝트 데이터와 요구사항이 필요합니다.' });
      return;
    }

    // 프로젝트가 완료 상태인지 확인
    const projectQuery = await sequelize.query(
      'SELECT type FROM projects WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!Array.isArray(projectQuery) || projectQuery.length === 0) {
      res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
      return;
    }

    const project = projectQuery[0] as any;
    if (project.type !== 'COMPLETE') {
      res.status(400).json({ message: '완료된 프로젝트만 파일을 생성할 수 있습니다.' });
      return;
    }

    // 간단한 프로젝트 결과물 생성 (예시)
    const projectSummary = {
      프로젝트명: projectData.name,
      구분: projectData.category,
      유형: projectData.type,
      기간: `${projectData.startDate} ~ ${projectData.endDate}`,
      시스템정보: {
        OS: projectData.os,
        메모리: projectData.memory,
      },
      버전정보: projectData.details,
      요구사항목록: requirements.map((req: any) => ({
        내용: req.content,
        상태: req.status,
        진행률: req.progress,
        작성자: req.authorName,
        등록일: req.registeredAt,
        완료일: req.completedAt,
      })),
      생성일시: new Date().toISOString(),
    };

    // JSON 형태로 반환
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${projectData.name}_결과물.json"`);
    res.json(projectSummary);

  } catch (error) {
    console.error('프로젝트 파일 생성 실패:', error);
    res.status(500).json({ message: '프로젝트 파일 생성 실패', error });
  }
}; 