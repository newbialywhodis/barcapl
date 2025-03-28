export interface UserRepository {
    getUserByNick(nick: string): Promise<any>;
    upsertUser(user: {
      id: string;
      email: string;
      nick: string;
      avatar?: string | null;
      description?: string | null;
      role?: 'Moderacja' | 'Sponsor' | null;
      joinedAt?: string;
    }): Promise<void>;
    getUserPosts(nick: string, limit?: number): Promise<any[]>;
  }
  
  export interface PostRepository {
    getAllPosts(): Promise<any[]>;
    createPost(post: {
      id: string;
      author: string;
      content: string;
      timestamp: string;
    }): Promise<void>;
  }
  
  export interface LikeRepository {
    getLike(postId: string, userId: string): Promise<any | null>;
    addLike(postId: string, userId: string): Promise<void>;
    removeLike(postId: string, userId: string): Promise<void>;
  }
  
  export interface Database {
    users: UserRepository;
    posts: PostRepository;
    likes: LikeRepository;
  }