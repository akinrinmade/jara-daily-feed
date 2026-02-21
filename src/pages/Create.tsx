import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGamification } from '@/contexts/GamificationContext';
import { useCoins } from '@/contexts/CoinContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMissions } from '@/contexts/MissionsContext';
import { useCreatePost } from '@/hooks/usePosts';
import { toast } from '@/hooks/use-toast';
import { ImagePlus, Send, Save, Wand2, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '@/types';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

const AI_HEADLINES: Record<string, string[]> = {
  Money: [
    'How I Turned ₦50K Into ₦500K Using This Simple Strategy',
    '5 Investment Mistakes Every Nigerian Makes (And How to Avoid Them)',
    'The Ultimate Guide to Building Wealth in Nigeria in 2026',
    'Why Your Savings Account Is Killing Your Financial Future',
  ],
  Hausa: [
    'Yadda Za Ka Canza Rayuwarka ta Hanyar Kasuwanci',
    'Sirrin Nasarar Yan Kasuwa Na Kano Da Ba Kowa Ya Sani',
    'Koyarwa Mai Mahimmanci Ga Duk Wanda Ke Son Cin Gajiyar Rayuwa',
    'Labarin Yadda Ake Kula Da Kuɗi Da Hikima',
  ],
  Gist: [
    'The Truth About Lagos That Nobody Wants to Hear',
    'Why Nigerians Are Winning Globally — And Nobody Is Talking About It',
    'The Japa Wave: Stories of Those Who Left and Those Who Stayed',
    'Inside the Rise of Nigerian Gen Z: Bold, Broke, and Building Anyway',
  ],
};

export default function Create() {
  const { addXP } = useGamification();
  const { earnCoins } = useCoins();
  const { user, isGuest, profile } = useAuth();
  const { incrementMission } = useMissions();
  const navigate = useNavigate();
  const createPost = useCreatePost();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (isGuest) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <h1 className="text-xl font-black mb-2">Create Post</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to start creating content.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </AppLayout>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Max 5MB allowed.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('post-images').upload(path, file, { upsert: true });
    if (error) {
      // Bucket might not exist yet — fallback to URL input
      toast({ title: 'Upload failed', description: 'Paste an image URL instead.', variant: 'destructive' });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(data.path);
      setImageUrl(publicUrl);
      toast({ title: 'Image uploaded!' });
    }
    setUploading(false);
  };

  const handleAIMagic = async () => {
    if (!category) {
      toast({ title: 'Select a category first', variant: 'destructive' });
      return;
    }
    setAiLoading(true);
    setShowSuggestions(false);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
    const pool = AI_HEADLINES[category as Category] ?? AI_HEADLINES['Gist'];
    setAiSuggestions([...pool].sort(() => Math.random() - 0.5).slice(0, 3));
    setAiLoading(false);
    setShowSuggestions(true);
  };

  const handlePublish = async () => {
    const plain = body.replace(/<[^>]*>/g, '').trim();
    if (!title.trim() || !plain || !category) {
      toast({ title: 'Missing fields', description: 'Title, body, and category are required.', variant: 'destructive' });
      return;
    }
    if (plain.length < 150) {
      toast({ title: 'Post too short', description: 'Please write at least 150 characters of content.', variant: 'destructive' });
      return;
    }
    if (!user) return;

    try {
      const result = await createPost.mutateAsync({
        title: title.trim(), content: body, category: category as Category,
        image_url: imageUrl, is_premium: isPremium, media_type: 'text', author_id: user.id,
      });
      addXP(20, 'Published an article');
      earnCoins(3, 'post', 'Published a post');
      incrementMission('share');
      toast({ title: '🎉 Published!', description: '+20 XP & Coins earned!' });
      setTitle(''); setBody(''); setCategory(''); setImageUrl(''); setIsPremium(false);
      navigate(`/post/${result.slug}`);
    } catch (err: any) {
      toast({ title: 'Publish failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  const handleSaveDraft = () => {
    if (!title && !body) return;
    localStorage.setItem('jara_draft', JSON.stringify({ title, body, category, imageUrl }));
    toast({ title: 'Draft saved locally' });
  };

  return (
    <AppLayout>
      <div className="py-4">
        <h1 className="text-xl font-black mb-4">Create Post</h1>
        <div className="space-y-4">
          {/* Title + AI Magic */}
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                placeholder="Post title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="text-base font-semibold flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleAIMagic} disabled={aiLoading}
                title="AI Magic Headlines" className="flex-shrink-0 border-primary/30 text-primary hover:bg-primary/5">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground pl-1">✨ Tap wand for AI headline suggestions</p>

            <AnimatePresence>
              {showSuggestions && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Wand2 className="h-3.5 w-3.5" /> AI Suggestions
                    </span>
                    <button onClick={() => setShowSuggestions(false)}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  </div>
                  {aiSuggestions.map((s, i) => (
                    <button key={i} onClick={() => { setTitle(s); setShowSuggestions(false); }}
                      className="w-full text-left text-xs p-2 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all">
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cover image */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Cover Image</label>
            <div className="flex gap-2">
              <Input placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="flex-1" />
              <label className={cn('cursor-pointer')}>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button variant="outline" size="icon" disabled={uploading} asChild>
                  <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}</span>
                </Button>
              </label>
            </div>
            {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 rounded-lg w-full aspect-[16/9] object-cover" />}
          </div>

          {/* Category */}
          <Select value={category} onValueChange={v => setCategory(v as Category)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Money">💰 Money</SelectItem>
              <SelectItem value="Hausa">🏛️ Hausa</SelectItem>
              <SelectItem value="Gist">💬 Gist</SelectItem>
            </SelectContent>
          </Select>

          {/* Premium toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border">
            <div>
              <Label htmlFor="premium-toggle" className="text-sm font-medium">Premium Post</Label>
              <p className="text-[10px] text-muted-foreground">Blur past 50% for guests — drives sign-ups</p>
            </div>
            <Switch id="premium-toggle" checked={isPremium} onCheckedChange={setIsPremium} />
          </div>

          <RichTextEditor content={body} onChange={setBody} />

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleSaveDraft}>
              <Save className="h-4 w-4 mr-1.5" /> Save Draft
            </Button>
            <Button className="flex-1" onClick={handlePublish} disabled={createPost.isPending}>
              {createPost.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
              {createPost.isPending ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
