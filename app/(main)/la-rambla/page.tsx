'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-db';
import { Stack, Blockquote, Text, Notification, Button } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import Post from '@/app/_components/la-rambla/Post';
import NewPost from '@/app/_components/la-rambla/NewPost';
import { useRouter } from 'next/navigation';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface PostData {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likesCount: number;
  isLiked: boolean;
  is_online?: boolean;
  role?: string | null;
  joined_at?: string;
}

export default function LaRambla() {
  const [session, setSession] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [content, setContent] = useState('');
  const [newPostsCount, setNewPostsCount] = useState(0);
  const router = useRouter();

  const fetchPosts = async () => {
    const posts = await db.posts.getAllPosts();
    console.log('Pobrane posty:', posts);
    const postsWithLikesAndUsers = await Promise.all(
      posts.map(async (post: any) => {
        const { data: likes } = await supabase
          .from('likes')
          .select('userid')
          .eq('postid', post.id);
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('nick, is_online, role, joined_at')
          .eq('nick', post.author)
          .single();
        console.log('Dane użytkownika dla postu:', { postAuthor: post.author, user, userError });
        return {
          ...post,
          likesCount: likes?.length || 0,
          isLiked: session ? likes?.some((like: any) => like.userid === session.user.id) : false,
          is_online: user?.is_online || false,
          role: user?.role || null,
          joined_at: user?.joined_at || null,
        };
      })
    );
    setPosts(
      postsWithLikesAndUsers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session); // Debug
      setSession(session);
    };

    fetchSession();
    fetchPosts();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', { event, newSession }); // Debug
      setSession(newSession);
      fetchPosts(); // Odśwież dane po zmianie sesji
    });

    const userChannel = supabase
      .channel('users')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        console.log('Realtime update users:', payload);
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.author === payload.new.nick ? { ...post, is_online: payload.new.is_online } : post
          )
        );
      })
      .subscribe();

    const postsChannel = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload: RealtimePostgresInsertPayload<PostData>) => {
          console.log('Nowy post Realtime:', payload);
          const { data: user } = await supabase
            .from('users')
            .select('nick, is_online, role, joined_at')
            .eq('nick', payload.new.author)
            .single();
          const newPost: PostData = {
            id: payload.new.id,
            author: payload.new.author,
            content: payload.new.content,
            timestamp: payload.new.timestamp,
            likesCount: 0,
            isLiked: false,
            is_online: user?.is_online || false,
            role: user?.role || null,
            joined_at: user?.joined_at || null,
          };
          setPosts((prev) =>
            [newPost, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          );
          setNewPostsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    const interval = setInterval(async () => {
      console.log('Odświeżanie co minutę');
      await fetchPosts();
    }, 60 * 1000);

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(userChannel);
      supabase.removeChannel(postsChannel);
      clearInterval(interval);
    };
  }, []); // Brak zależności od propSession, zarządzamy lokalnie

  const handlePostSubmit = async () => {
    if (!session || !content) return;
    const post = {
      id: Math.random().toString(36).slice(2),
      author: session.user.user_metadata.nick,
      content,
      timestamp: new Date().toISOString(),
    };
    await db.posts.createPost(post);
    setContent('');
    await fetchPosts();
    setNewPostsCount(0);
  };

  const handleLike = async (postId: string) => {
    if (!session) return;
    const existingLike = await db.likes.getLike(postId, session.user.id);
    if (existingLike) await db.likes.removeLike(postId, session.user.id);
    else await db.likes.addLike(postId, session.user.id);
    await fetchPosts();
  };

  const handleRefresh = async () => {
    await fetchPosts();
    setNewPostsCount(0);
  };

  return (
    <Stack p="md" maw={800} mx="auto">
      <Blockquote color="blue" cite="Moderacja" icon={<IconInfoCircle />}>
        Witamy na La Rambla, gdzie dyskusje toczą się całą dobę! La Rambla to dział stworzony specjalnie dla zarejestrowanych Użytkowników FCBarca.com. Zapraszamy do rejestracji oraz dyskusji nie tylko o Barcelonie i nie tylko o piłce nożnej. W tym dziale obowiązuje regulamin serwisu FCBarca.com, który znajdziecie tutaj.
      </Blockquote>
      <Text size="xl">La Rambla</Text>
      {newPostsCount > 0 && (
        <Notification title={`${newPostsCount} nowe wpisy`} withCloseButton={false}>
          <Button size="xs" onClick={handleRefresh}>Odśwież</Button>
        </Notification>
      )}
      {session && (
        <NewPost
          content={content}
          onContentChange={setContent}
          onSubmit={handlePostSubmit}
          session={session}
        />
      )}
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onLike={handleLike}
          session={session}
          likesCount={post.likesCount}
          isLiked={post.isLiked}
        />
      ))}
    </Stack>
  );
}