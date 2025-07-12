import { Request, Response } from 'express';
import sequelize from '../config/db';
import { QueryTypes } from 'sequelize';

// 게시글 목록 조회
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = '';
    const replacements: any = { limit: Number(limit), offset };
    
    if (category && category !== 'all') {
      whereClause += ' AND bp.category = :category';
      replacements.category = category;
    }
    
    if (search) {
      whereClause += ' AND (bp.title ILIKE :search OR bp.content ILIKE :search)';
      replacements.search = `%${search}%`;
    }

    const query = `
      SELECT 
        bp.id,
        bp.title,
        bp.content,
        bp.category,
        bp.views,
        bp.likes,
        bp.is_pinned,
        TO_CHAR(bp.created_at, 'YYYY-MM-DD HH24:MI') as "createdAt",
        TO_CHAR(bp.updated_at, 'YYYY-MM-DD HH24:MI') as "updatedAt",
        u.name as "authorName",
        bp.author_id,
        COALESCE(cc.comment_count, 0) as "commentCount"
      FROM board_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count 
        FROM board_comments 
        GROUP BY post_id
      ) cc ON bp.id = cc.post_id
      WHERE 1=1 ${whereClause}
      ORDER BY bp.is_pinned DESC, bp.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const posts = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });
    
    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM board_posts bp
      WHERE 1=1 ${whereClause}
    `;
    const countResult = await sequelize.query(countQuery, { 
      replacements: { category, search: search ? `%${search}%` : null }, 
      type: QueryTypes.SELECT 
    });
    const total = (countResult[0] as any).total;

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        totalPages: Math.ceil(Number(total) / Number(limit))
      }
    });
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error);
    res.status(500).json({ message: '게시글 목록 조회에 실패했습니다.' });
  }
};

// 게시글 상세 조회
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    // 조회수 증가
    await sequelize.query(
      'UPDATE board_posts SET views = views + 1 WHERE id = :id',
      { replacements: { id }, type: QueryTypes.UPDATE }
    );

    // 게시글 조회
    const postQuery = `
      SELECT 
        bp.id,
        bp.title,
        bp.content,
        bp.category,
        bp.views,
        bp.likes,
        bp.is_pinned,
        TO_CHAR(bp.created_at, 'YYYY-MM-DD HH24:MI') as "createdAt",
        TO_CHAR(bp.updated_at, 'YYYY-MM-DD HH24:MI') as "updatedAt",
        u.name as "authorName",
        bp.author_id
      FROM board_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.id = :id
    `;

    const posts = await sequelize.query(postQuery, { 
      replacements: { id }, 
      type: QueryTypes.SELECT 
    });

    if (!posts.length) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    const post = posts[0];

    // 댓글 조회
    const commentsQuery = `
      SELECT 
        bc.id,
        bc.content,
        bc.parent_id,
        TO_CHAR(bc.created_at, 'YYYY-MM-DD HH24:MI') as "createdAt",
        TO_CHAR(bc.updated_at, 'YYYY-MM-DD HH24:MI') as "updatedAt",
        u.name as "authorName",
        bc.author_id
      FROM board_comments bc
      LEFT JOIN users u ON bc.author_id = u.id
      WHERE bc.post_id = :id
      ORDER BY bc.created_at ASC
    `;

    const comments = await sequelize.query(commentsQuery, { 
      replacements: { id }, 
      type: QueryTypes.SELECT 
    });

    // 사용자가 좋아요를 눌렀는지 확인
    let isLiked = false;
    if (currentUserId) {
      const likeCheck = await sequelize.query(
        'SELECT 1 FROM board_likes WHERE post_id = :post_id AND user_id = :user_id',
        { replacements: { post_id: id, user_id: currentUserId }, type: QueryTypes.SELECT }
      );
      isLiked = likeCheck.length > 0;
    }

    res.json({
      post,
      comments,
      isLiked
    });
  } catch (error) {
    console.error('게시글 상세 조회 실패:', error);
    res.status(500).json({ message: '게시글 상세 조회에 실패했습니다.' });
  }
};

// 게시글 작성
export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, category = 'free' } = req.body;
    const authorId = req.user?.id;

    if (!title || !content) {
      res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    const result = await sequelize.query(
      `INSERT INTO board_posts (title, content, category, author_id) 
       VALUES (:title, :content, :category, :authorId) 
       RETURNING id`,
      {
        replacements: { title, content, category, authorId },
        type: QueryTypes.SELECT
      }
    );

    const postId = (result[0] as any).id;

    res.status(201).json({ 
      message: '게시글이 등록되었습니다.',
      postId 
    });
  } catch (error) {
    console.error('게시글 작성 실패:', error);
    res.status(500).json({ message: '게시글 작성에 실패했습니다.' });
  }
};

// 게시글 수정
export const updatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    if (!title || !content) {
      res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    // 게시글 작성자 확인
    const postCheck = await sequelize.query(
      'SELECT author_id FROM board_posts WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!postCheck.length) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    const post = postCheck[0] as any;
    
    // 권한 확인 (작성자 또는 관리자만 수정 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== post.author_id) {
      res.status(403).json({ message: '게시글을 수정할 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      `UPDATE board_posts 
       SET title = :title, content = :content, category = :category, updated_at = NOW() 
       WHERE id = :id`,
      {
        replacements: { title, content, category, id },
        type: QueryTypes.UPDATE
      }
    );

    res.json({ message: '게시글이 수정되었습니다.' });
  } catch (error) {
    console.error('게시글 수정 실패:', error);
    res.status(500).json({ message: '게시글 수정에 실패했습니다.' });
  }
};

// 게시글 삭제
export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 게시글 작성자 확인
    const postCheck = await sequelize.query(
      'SELECT author_id FROM board_posts WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!postCheck.length) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    const post = postCheck[0] as any;
    
    // 권한 확인 (작성자 또는 관리자만 삭제 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== post.author_id) {
      res.status(403).json({ message: '게시글을 삭제할 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      'DELETE FROM board_posts WHERE id = :id',
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    res.status(500).json({ message: '게시글 삭제에 실패했습니다.' });
  }
};

// 댓글 작성
export const createComment = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, parentId = null } = req.body;
    const authorId = req.user?.id;

    if (!content) {
      res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
      return;
    }

    // 게시글 존재 확인
    const postCheck = await sequelize.query(
      'SELECT id FROM board_posts WHERE id = :postId',
      { replacements: { postId }, type: QueryTypes.SELECT }
    );

    if (!postCheck.length) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    await sequelize.query(
      `INSERT INTO board_comments (post_id, content, author_id, parent_id) 
       VALUES (:postId, :content, :authorId, :parentId)`,
      {
        replacements: { postId, content, authorId, parentId },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({ message: '댓글이 등록되었습니다.' });
  } catch (error) {
    console.error('댓글 작성 실패:', error);
    res.status(500).json({ message: '댓글 작성에 실패했습니다.' });
  }
};

// 댓글 삭제
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 댓글 작성자 확인
    const commentCheck = await sequelize.query(
      'SELECT author_id FROM board_comments WHERE id = :commentId',
      { replacements: { commentId }, type: QueryTypes.SELECT }
    );

    if (!commentCheck.length) {
      res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
      return;
    }

    const comment = commentCheck[0] as any;
    
    // 권한 확인 (작성자 또는 관리자만 삭제 가능)
    if (currentUserRole !== 'ADMIN' && currentUserId !== comment.author_id) {
      res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
      return;
    }

    await sequelize.query(
      'DELETE FROM board_comments WHERE id = :commentId',
      { replacements: { commentId }, type: QueryTypes.DELETE }
    );

    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    res.status(500).json({ message: '댓글 삭제에 실패했습니다.' });
  }
};

// 게시글 좋아요/좋아요 취소
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    // 게시글 존재 확인
    const postCheck = await sequelize.query(
      'SELECT id FROM board_posts WHERE id = :postId',
      { replacements: { postId }, type: QueryTypes.SELECT }
    );

    if (!postCheck.length) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    // 기존 좋아요 확인
    const existingLike = await sequelize.query(
      'SELECT id FROM board_likes WHERE post_id = :postId AND user_id = :userId',
      { replacements: { postId, userId }, type: QueryTypes.SELECT }
    );

    let isLiked = false;
    
    if (existingLike.length > 0) {
      // 좋아요 취소
      await sequelize.query(
        'DELETE FROM board_likes WHERE post_id = :postId AND user_id = :userId',
        { replacements: { postId, userId }, type: QueryTypes.DELETE }
      );
      
      // 좋아요 수 감소
      await sequelize.query(
        'UPDATE board_posts SET likes = likes - 1 WHERE id = :postId',
        { replacements: { postId }, type: QueryTypes.UPDATE }
      );
      
      isLiked = false;
    } else {
      // 좋아요 추가
      await sequelize.query(
        'INSERT INTO board_likes (post_id, user_id) VALUES (:postId, :userId)',
        { replacements: { postId, userId }, type: QueryTypes.INSERT }
      );
      
      // 좋아요 수 증가
      await sequelize.query(
        'UPDATE board_posts SET likes = likes + 1 WHERE id = :postId',
        { replacements: { postId }, type: QueryTypes.UPDATE }
      );
      
      isLiked = true;
    }

    // 업데이트된 좋아요 수 조회
    const likeCount = await sequelize.query(
      'SELECT likes FROM board_posts WHERE id = :postId',
      { replacements: { postId }, type: QueryTypes.SELECT }
    );

    res.json({ 
      isLiked, 
      likeCount: (likeCount[0] as any).likes 
    });
  } catch (error) {
    console.error('좋아요 토글 실패:', error);
    res.status(500).json({ message: '좋아요 처리에 실패했습니다.' });
  }
}; 