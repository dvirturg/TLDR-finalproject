export interface PostInter {
  id?: string;
  _id?: string;
  text: string;
  imageUrl?: string;
  author: {
    id: string;
    username: string;
    profileUrl: string;
  };
  likes: number | string[];
  likedByCurrentUser?: boolean;
  commentCount: number;
}

export interface UserProfileData {
  id: string;
  username: string;
  profileUrl: string;
}

export interface CommentInter {
  id?: string;
  _id?: string;
  text: string;
  author: {
    username: string;
    profileUrl: string;
  };
  createdAt: string;
}
