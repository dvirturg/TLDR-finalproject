import React from 'react';
import { PostInter } from '../types';

interface PostCardProps {
  post: PostInter;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="post-card">
      <div className="post-header">
        <img src={post.author.profileUrl} alt={post.author.username} className="profile-pic" />
        <span className="username">{post.author.username}</span>
      </div>
      <div className="post-content">
        <p>{post.text}</p>
        {post.imageUrl && <img src={post.imageUrl} alt="Post image" className="post-image" />}
      </div>
      <div className="post-actions">
        <button className="like-button">
          Like ({post.likes})
        </button>
        <button className="comment-button">
          Comment ({post.commentCount})
        </button>
      </div>
    </div>
  );
};

export default PostCard;
