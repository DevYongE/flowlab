import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  commentCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const BoardPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('search') || '';

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'free', label: '자유' },
    { value: 'info', label: '정보' },
    { value: 'question', label: '질문' },
    { value: 'notice', label: '공지' }
  ];

  useEffect(() => {
    loadPosts();
  }, [currentPage, currentCategory, currentSearch]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      if (currentCategory !== 'all') params.append('category', currentCategory);
      if (currentSearch) params.append('search', currentSearch);

      const response = await axios.get(`/board?${params.toString()}`);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('게시글 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSearchParams({ category, page: '1' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const search = formData.get('search') as string;
    setSearchParams({ 
      category: currentCategory, 
      search: search || '', 
      page: '1' 
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ 
      category: currentCategory, 
      search: currentSearch, 
      page: page.toString() 
    });
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">🗣️ 자유게시판</h1>
          <Button onClick={() => navigate('/board/write')}>
            글쓰기
          </Button>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex space-x-1">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                currentCategory === category.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            name="search"
            placeholder="제목 또는 내용으로 검색..."
            defaultValue={currentSearch}
            className="flex-1"
          />
          <Button type="submit">검색</Button>
        </form>

        {/* 게시글 목록 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">제목</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">작성자</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">작성일</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 w-16">조회</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 w-16">좋아요</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr 
                      key={post.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${
                        post.is_pinned ? 'bg-yellow-50' : ''
                      }`}
                      onClick={() => navigate(`/board/${post.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {post.is_pinned && (
                            <span className="text-red-500 text-sm">📌</span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(post.category)}`}>
                            {getCategoryLabel(post.category)}
                          </span>
                          <span className="font-medium text-gray-900">
                            {post.title}
                          </span>
                          {post.commentCount > 0 && (
                            <span className="text-blue-500 text-sm">
                              [{post.commentCount}]
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {post.authorName}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {post.createdAt}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {post.views}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {post.likes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              이전
            </Button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={pagination.page === page ? "default" : "outline"}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BoardPage; 