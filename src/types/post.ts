export type postType = {
  _id: string;
  content?: string;
  image?: string;
  authorId: {
    _id: string;
    username: string;
    name: string;
    image: string;
  };
  comments: {
    _id: string;
    content: string;
    createdAt: string;
    authorId: {
      _id: string;
      username: string;
      name: string;
      image: string;
    };
  }[];
  likes: {
    _id: string;
    userId: string;
  }[];
  _count: {
    likes: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
};
