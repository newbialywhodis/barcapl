import { supabase } from './supabase';
import { Database, UserRepository, PostRepository, LikeRepository } from './db-interface';

class SupabaseUserRepository implements UserRepository {
  async getUserByNick(nick: string): Promise<any> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('nick', nick)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  async upsertUser(user: {
    id: string;
    email: string;
    nick: string;
    avatar?: string | null;
    description?: string | null;
    role?: 'Moderacja' | 'Sponsor' | null;
    joined_at?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'id' });
    if (error) throw error;
  }

  async getUserPosts(nick: string, limit: number = 5): Promise<any[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author', nick)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}

class SupabasePostRepository implements PostRepository {
  async getAllPosts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createPost(post: {
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }): Promise<void> {
    const { error } = await supabase.from('posts').insert([post]);
    if (error) throw error;
  }
}

class SupabaseLikeRepository implements LikeRepository {
  async getLike(postId: string, userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('postid', postId)
      .eq('userid', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async addLike(postId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('likes').insert([{ postid: postId, userid: userId }]);
    if (error) throw error;
  }

  async removeLike(postId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('postid', postId)
      .eq('userid', userId);
    if (error) throw error;
  }
}

export const db: Database = {
  users: new SupabaseUserRepository(),
  posts: new SupabasePostRepository(),
  likes: new SupabaseLikeRepository(),
};