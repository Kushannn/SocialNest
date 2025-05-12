export type Author = {
  _id: string;
  name: string;
  username: string;
  image: string;
};

export type Comment = {
  _id: string;
  content: string;
  createdAt: Date;
  authorId: Author;
};

export type Like = {
  userId: string;
};

export type Post = {
  _id: string;
  authorId: Author;
  content?: string;
  image?: string;
  comments: Comment[];
  likes: Like[];
  createdAt: Date;
  updatedAt: Date;
  _count: {
    likes: number;
    comments: number;
  };
};
