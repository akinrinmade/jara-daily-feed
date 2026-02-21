import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePost, useIncrementView } from '@/hooks/usePosts';
import { useComments, useAddComment } from '@/hooks/useComments';
import { useGamification } from '@/contexts/GamificationContext';
import { useCoins } from '@/contexts/CoinContext';
import { useMissions } from '@/contexts/MissionsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/feed/PostCard';
import { TipDialog } from '@/components/creator/TipDialog';
import { BoostDialog } from '@/components/creator/BoostDialog';
import { usePosts } from '@/hooks/usePosts';
import { ArrowLeft, Heart, Share2, MessageCircle, Bookmark, Clock, Send, Rocket, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const REACTIONS = ['🔥', '❤️', '😂', '👏'];

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addXP, markPostRead, toggleSavePost, savedPosts } = useGamification();
  const { earnCoins } = useCoins();
  const { incrementMission } = useMissions();

  const { data: post, isLoading } = usePost(slug);
  const { data: comments = [], isLoading: commentsLoading } = useComments(post?.id);
  const { data: relatedRaw = [] } = usePosts(post?.category, 4);
  const addCommentMutation = useAddComment();
  const incrementView = useIncrementView();

  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [scrollDepthPct, setScrollDepthPct] = useState(0);
  const [blurred, setBlurred] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const hasTrackedRead = useRef(false);
  const hasRewardedReaction = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const maxScroll = useRef(0);
  const startTime = useRef(Date.now());

  const isSaved = post ? savedPosts.includes(post.id) : false;
  useSeo({ title: post?.title, description: post?.excerpt, image: post?.imageUrl });
  const relatedPosts = relatedRaw.filter(p => p.id !== post?.id).slice(0, 3);

  // Increment view count once
  useEffect(() => {
    if (post?.id) {
      incrementView.mutate({ postId: post.id, userId: user?.id });
    }
  }, [post?.id]); // eslint-disable-line

  // Scroll depth + premium blur + read verification
  useEffect(() => {
    if (!post) return;
    startTime.current = Date.now();
    maxScroll.current = 0;
    hasTrackedRead.current = false;
    setScrollDepthPct(0);
    setBlurred(false);

    const handleScroll = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const depth = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / contentRef.current.scrollHeight));
      if (depth > maxScroll.current) {
        maxScroll.current = depth;
        setScrollDepthPct(Math.round(depth * 100));
        if (depth % 0.25 < 0.01) {
          console.log(`[Activity] scroll depth=${Math.round(depth * 100)}% slug=${post.slug} time=${Math.round((Date.now() - startTime.current) / 1000)}s`);
        }
      }
      if (post.isPremium && depth > 0.5 && !user) setBlurred(true);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const timer = setInterval(() => {
      if (hasTrackedRead.current) { clearInterval(timer); return; }
      const seconds = (Date.now() - startTime.current) / 1000;
      const required = Math.max(15, (post.readTime * 60) * 0.35);
      if (maxScroll.current > 0.75 && seconds >= required) {
        hasTrackedRead.current = true;
        markPostRead(post.id);
        earnCoins(1, 'read', 'Finished reading', post.id);
        incrementMission('read');
        clearInterval(timer);
      }
    }, 1000);

    return () => { window.removeEventListener('scroll', handleScroll); clearInterval(timer); };
  }, [post?.slug, post?.isPremium, user]); // eslint-disable-line

  const handleReaction = async (emoji: string) => {
    if (!post) return;
    const next = activeReaction === emoji ? null : emoji;
    setActiveReaction(next);
    if (next && !hasRewardedReaction.current) {
      hasRewardedReaction.current = true;
      addXP(2, `Reacted ${emoji}`);
      earnCoins(1, 'like', `Reacted ${emoji}`, post.id);
      incrementMission('react');
    }
    if (user) await supabase.rpc('react_to_post', { p_post_id: post.id, p_user_id: user.id, p_emoji: emoji });
  };

  const handleShare = () => {
    if (!post) return;
    addXP(5, 'Shared a post');
    earnCoins(2, 'share', 'Shared', post.id);
    incrementMission('share');
    if (navigator.share) {
      navigator.share({ title: post.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!' });
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !post) return;
    const text = newComment.trim();

    if (!user) { navigate('/auth'); return; }
    if (text.length < 2) return;

    setSubmittingComment(true);
    try {
      await addCommentMutation.mutateAsync({ postId: post.id, authorId: user.id, content: text });
      setNewComment('');
      if (text.length >= 20) {
        addXP(5, 'Insightful comment');
        earnCoins(2, 'comment', 'Comment', post.id);
        incrementMission('comment');
      }
    } catch {
      toast({ title: 'Comment failed', variant: 'destructive' });
    } finally {
      setSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="py-4 space-y-4">
          <Skeleton className="w-full aspect-[16/9] rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-black mb-2">Post not found</h1>
          <p className="text-sm text-muted-foreground mb-6">This post may have been removed or the link is broken.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </AppLayout>
    );
  }

  return (
      <AppLayout>
        {/* Reading progress bar */}
        <div className="fixed top-14 left-0 right-0 z-40 h-0.5 bg-border">
          <div className="h-full bg-primary transition-all duration-100" style={{ width: `${scrollDepthPct}%` }} />
        </div>

        <div className="py-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <img src={post.imageUrl} alt={post.title} className="w-full aspect-[16/9] object-cover rounded-xl mb-4" loading="eager" />

          <div className="flex items-center gap-2 mb-3">
            <Badge>{post.category}</Badge>
            {post.isPremium && <Badge className="bg-amber-500 text-white border-none">Premium</Badge>}
          </div>

          <h1 className="text-2xl font-black leading-tight mb-3">{post.title}</h1>

          <div className="flex items-center gap-3 mb-5">
            <Avatar className="h-9 w-9">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{post.author.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {post.readTime} min read ·{' '}
                {new Date(post.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div ref={contentRef} className="relative">
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {blurred && post.isPremium && !user && (
              <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center justify-end pb-6">
                <p className="text-sm font-black mb-1">Sign up to read the full post</p>
                <p className="text-xs text-muted-foreground mb-3">Premium content — earn XP & Coins as a member</p>
                <Button asChild><Link to="/auth">Sign Up Free</Link></Button>
              </div>
            )}
          </div>

          {/* Reactions */}
          <div className="flex items-center gap-2 mt-6 mb-4">
            {REACTIONS.map(emoji => (
              <button key={emoji} onClick={() => handleReaction(emoji)}
                className={cn('px-3 py-1.5 rounded-full border text-sm transition-all',
                  activeReaction === emoji ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/50'
                )}>
                {emoji}
              </button>
            ))}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-1 pb-4 border-b border-border flex-wrap">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleSavePost(post.id)}>
              <Bookmark className={cn('h-4 w-4 mr-1.5', isSaved && 'fill-current text-primary')} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
            {user && (
              <>
                <TipDialog authorId={post.author.id} authorName={post.author.name} postId={post.id}>
                  <Button variant="ghost" size="sm"><Heart className="h-4 w-4 mr-1.5 text-pink-500" /> Tip</Button>
                </TipDialog>
                <BoostDialog postId={post.id} postTitle={post.title}>
                  <Button variant="ghost" size="sm"><Rocket className="h-4 w-4 mr-1.5 text-primary" /> Boost</Button>
                </BoostDialog>
              </>
            )}
          </div>

          {/* Comments */}
          <section className="mt-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" /> Comments ({comments.length})
            </h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder={user ? 'Add a comment...' : 'Sign in to comment'}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                className="flex-1"
              />
              <Button size="icon" onClick={handleComment} disabled={!newComment.trim() || submittingComment}>
                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {commentsLoading ? (
              <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={c.author.avatar_url} />
                      <AvatarFallback>{c.author.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{c.author.username}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-6">
              <h3 className="font-bold text-sm mb-3">Related Posts</h3>
              <div className="flex flex-col gap-3">
                {relatedPosts.map(p => <PostCard key={p.id} post={p} />)}
              </div>
            </section>
          )}
        </div>
      </AppLayout>
    </>
  );
}
