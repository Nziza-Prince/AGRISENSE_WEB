import DashboardLayout from "./DashboardLayout"
import { EmptyState } from "@/components/EmptyState";
import { useCallback, useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react';
import {
  ApiError,
  communityService,
  type CommunityPost,
} from '@/api';
import { useAuth } from '@/context/useAuth';
import { sanitizeText } from '@/lib/validation';
import { getUserDisplayName } from '@/lib/user';
import { Link } from 'react-router-dom';
import { routes } from '@/lib/routes';
import { MessageSquare } from 'lucide-react';

const MAX_POST_LENGTH = 2000;
const MAX_COMMENT_LENGTH = 500;

function getPostsFromResponse(data: unknown): CommunityPost[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const items = record.posts ?? record.items ?? record.data;
  return Array.isArray(items) ? (items as CommunityPost[]) : [];
}

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [busyPostId, setBusyPostId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Community | AGRISENSE';
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communityService.getPosts();
      setPosts(getPostsFromResponse(data));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const description = sanitizeText(newPost).slice(0, MAX_POST_LENGTH);
    if (!description) return;

    setPosting(true);
    setError(null);
    try {
      const created = await communityService.createPost({
        title: sanitizeText(newTitle).slice(0, 120) || undefined,
        description,
        image: newImage || undefined,
      });
      // The create response sometimes omits a populated author. Since we know
      // the current user authored it, fill it in so it never shows "Unknown".
      const withAuthor: CommunityPost = {
        ...created,
        author: created.author?.username
          ? created.author
          : user
            ? {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              }
            : created.author,
        likes: created.likes ?? [],
        comments: created.comments ?? [],
        createdAt: created.createdAt ?? new Date().toISOString(),
      };
      setPosts((prev) => [withAuthor, ...prev]);
      setNewTitle('');
      setNewPost('');
      setNewImage(null);
      // Reload in the background to reconcile with the server's canonical data.
      loadPosts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create post.');
    } finally {
      setPosting(false);
    }
  };

  const isLikedByMe = (post: CommunityPost) =>
    !!user && post.likes?.some((l) => l.user?.id === user.id);

  // Resolve a friendly author name even when the API omits the author object.
  const authorName = (post: CommunityPost) => {
    return getUserDisplayName(post.author) || getUserDisplayName(user) || 'Community member';
  };

  const handleLike = async (post: CommunityPost) => {
    setBusyPostId(post.id);
    try {
      await communityService.toggleLike(post.id);
      // Refresh just to keep like state accurate with the backend.
      await loadPosts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to like post.');
    } finally {
      setBusyPostId(null);
    }
  };

  const handleComment = async (post: CommunityPost) => {
    const content = sanitizeText(commentDrafts[post.id] || '').slice(0, MAX_COMMENT_LENGTH);
    if (!content) return;
    setBusyPostId(post.id);
    try {
      await communityService.addComment(post.id, { content });
      setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
      await loadPosts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add comment.');
    } finally {
      setBusyPostId(null);
    }
  };

  return (
    <DashboardLayout>

        <div className="p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-[#0B6E4F]">Community</h1>
            <Link
              to={routes.app.messages}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#2C6E49] px-3 py-2 text-sm font-semibold text-[#2C6E49] hover:bg-[#2C6E49]/5"
            >
              <MessageSquare className="h-4 w-4" /> Messages
            </Link>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Create post */}
          <form
            onSubmit={handleCreatePost}
            className="bg-white border rounded-lg shadow-sm p-4 space-y-3"
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Post title"
              maxLength={120}
              className="w-full border rounded-md p-3 text-sm outline-none focus:border-[#2C6E49]"
            />
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something with the community…"
              rows={3}
              maxLength={MAX_POST_LENGTH}
              className="w-full border rounded-md p-3 text-sm outline-none focus:border-[#2C6E49] resize-none"
            />
            <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files?.[0] || null)} />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="bg-[#2C6E49] hover:bg-[#23583a] text-white font-semibold text-sm px-5 py-2 rounded-md transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post
              </button>
            </div>
          </form>

          {/* Feed */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#2C6E49]" />
            </div>
          ) : posts.length === 0 ? (
            <EmptyState art="chat" title="The conversation starts with you" text="Share a tip, a question or a harvest photo with other farmers." />
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <article key={post.id} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-[#2C6E49] flex items-center justify-center font-bold uppercase">
                      {authorName(post).charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{authorName(post)}</p>
                      <p className="text-xs text-gray-400">
                        {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                  </div>

                  {post.title && <h2 className="mb-2 text-base font-semibold text-gray-900">{post.title}</h2>}
                  <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{post.description}</p>

                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="rounded-md max-h-80 w-full object-cover mb-3"
                    />
                  )}

                  <div className="flex items-center gap-6 border-t pt-3 text-sm text-gray-600">
                    <button
                      onClick={() => handleLike(post)}
                      disabled={busyPostId === post.id}
                      className="flex items-center gap-1.5 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Heart
                        className={`h-4 w-4 ${isLikedByMe(post) ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {post.likes?.length || 0}
                    </button>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments?.length || 0}
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await communityService.reportPost(post.id, {
                            reason: "OTHER",
                            description: "Reported from web community page.",
                          });
                        } catch (err) {
                          setError(err instanceof ApiError ? err.message : 'Failed to report post.');
                        }
                      }}
                      className="hover:text-amber-600"
                    >
                      Report
                    </button>
                    {user?.id === post.author?.id && (
                      <button
                        onClick={async () => {
                          try {
                            await communityService.deletePost(post.id);
                            await loadPosts();
                          } catch (err) {
                            setError(err instanceof ApiError ? err.message : 'Failed to delete post.');
                          }
                        }}
                        className="hover:text-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Comments */}
                  {post.comments?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {post.comments.map((c) => (
                        <div key={c.id} className="bg-gray-50 rounded-md px-3 py-2">
                          <p className="text-xs font-semibold text-gray-700">
                            {getUserDisplayName(c.author) ||
                              (user && c.author?.id === user.id ? getUserDisplayName(user) : 'Community member')}
                          </p>
                          <p className="text-sm text-gray-700">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add comment */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleComment(post);
                        }
                      }}
                      placeholder="Write a comment…"
                      maxLength={MAX_COMMENT_LENGTH}
                      className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-[#2C6E49]"
                    />
                    <button
                      onClick={() => handleComment(post)}
                      disabled={busyPostId === post.id || !(commentDrafts[post.id] || '').trim()}
                      className="text-[#2C6E49] hover:text-[#23583a] disabled:opacity-40"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
  );
};

export default Community;
