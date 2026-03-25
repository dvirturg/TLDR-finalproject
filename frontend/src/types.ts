export interface PostInter {
  id: string;
  text: string;
  imageUrl?: string;
  author: {
    id: string;
    username: string;
    profileUrl: string;
  };
  likes: number;
  likedByCurrentUser?: boolean;
  commentCount: number;
}

export interface UserProfileData {
  id: string;
  username: string;
  profileUrl: string;
}

export interface CommentInter {
  id: string;
  text: string;
  author: {
    username: string;
    profileUrl: string;
  };
}
