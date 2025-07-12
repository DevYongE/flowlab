import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import axios from '../lib/axios';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  views: number;
  likes: number;
  is_pinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  author_id: string;
}

interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
  author_id: string;
}

const BoardDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // 현재 사용자 정보 (sessionStorage에서 가져옴)
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/board/${id}`);
      setPost(response.data.post);
      setComments(response.data.comments);
      setIsLiked(response.data.isLiked);
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error);
      alert('게시글을 불러올 수 없습니다.');
      navigate('/board');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axios.post(`/board/${id}/like`);
      setIsLiked(response.data.isLiked);
      if (post) {
        setPost({ ...post, likes: response.data.likeCount });
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      await axios.post(`/board/${id}/comments`, {
        content: commentContent,
        parentId: null
      });
      setCommentContent('');
      loadPost(); // 댓글 새로고침
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다.');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await axios.post(`/board/${id}/comments`, {
        content: replyContent,
        parentId: parentId
      });
      setReplyContent('');
      setReplyTo(null);
      loadPost(); // 댓글 새로고침
    } catch (error) {
      console.error('답글 작성 실패:', error);
      alert('답글 작성에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/board/comments/${commentId}`);
      loadPost(); // 댓글 새로고침
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('정말 게시글을 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/board/${id}`);
      alert('게시글이 삭제되었습니다.');
      navigate('/board');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      free: '자유',
      info: '정보',
      question: '질문',
      notice: '공지'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'free': return 'bg-blue-100 text-blue-800';
      case 'info': return 'bg-green-100 text-green-800';
      case 'question': return 'bg-yellow-100 text-yellow-800';
      case 'notice': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 댓글을 계층 구조로 정렬
  const getNestedComments = (comments: Comment[], parentId: number | null = null): Comment[] => {
    return comments
      .filter(comment => comment.parent_id === parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const renderComments = (comments: Comment[], level: number = 0) => {
    return comments.map((comment) => {
      const replies = getNestedComments(comments, comment.id);
      const canDelete = currentUser.id === comment.author_id || currentUser.role === 'ADMIN';

      return (
        <div key={comment.id} className={`${level > 0 ? 'ml-8 border-l pl-4' : ''}`}>
          <div className="bg-gray-50 p-4 rounded-lg mb-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-800">{comment.authorName}</span>
                <span className="text-sm text-gray-500">{comment.createdAt}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  답글
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            
            {/* 답글 작성 폼 */}
            {replyTo === comment.id && (
              <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="mt-3">
                <div className="flex gap-2">
                  <Input
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 작성하세요..."
                    className="flex-1"
                  />
                  <Button type="submit">답글</Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setReplyTo(null)}
                  >
                    취소
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          {/* 대댓글 렌더링 */}
          {replies.length > 0 && renderComments(replies, level + 1)}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">게시글을 찾을 수 없습니다.</div>
        </div>
      </MainLayout>
    );
  }

  const canEdit = currentUser.id === post.author_id || currentUser.role === 'ADMIN';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">🗣️ 자유게시판</h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/board')}
            >
              목록
            </Button>
            {canEdit && (
              <>
                <Button
                  onClick={() => navigate(`/board/edit/${post.id}`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  수정
                </Button>
                <Button
                  onClick={handleDeletePost}
                  className="bg-red-500 hover:bg-red-600"
                >
                  삭제
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 게시글 */}
        <Card>
          <CardContent className="p-6">
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {post.is_pinned && (
                    <span className="text-red-500 text-sm">📌</span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(post.category)}`}>
                    {getCategoryLabel(post.category)}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>작성자: {post.authorName}</span>
                  <span>작성일: {post.createdAt}</span>
                  {post.updatedAt !== post.createdAt && (
                    <span>수정일: {post.updatedAt}</span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span>조회수: {post.views}</span>
                  <span>좋아요: {post.likes}</span>
                </div>
              </div>
            </div>

            <div className="prose max-w-none mb-6">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {post.content}
              </div>
            </div>

            {/* 좋아요 버튼 */}
            <div className="flex justify-center">
              <Button
                onClick={handleLike}
                className={`${
                  isLiked 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isLiked ? '❤️' : '🤍'} 좋아요 {post.likes}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 댓글 섹션 */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">댓글 {comments.length}개</h3>
            
            {/* 댓글 작성 폼 */}
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex gap-2">
                <Input
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="댓글을 작성하세요..."
                  className="flex-1"
                />
                <Button type="submit">댓글 작성</Button>
              </div>
            </form>

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {renderComments(getNestedComments(comments))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BoardDetailPage; 