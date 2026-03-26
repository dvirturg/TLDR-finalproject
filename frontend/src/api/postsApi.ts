import axiosInstance from './axiosInstance';
import type { PostInter } from '../types';

export const getPosts = async (params?: { page?: number; limit?: number; q?: string }) => {
  const response = await axiosInstance.get<{ data: PostInter[]; pages: number }>('/post', { params });
  return response.data;
};

export const getPostById = async (id: string) => {
  const response = await axiosInstance.get<PostInter>(`/post/${id}`);
  return response.data;
};

export const createPost = async (data: FormData) => {
  const response = await axiosInstance.post<PostInter>('/post', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updatePost = async (id: string, data: Partial<PostInter>) => {
  const response = await axiosInstance.put<PostInter>(`/post/${id}`, data);
  return response.data;
};

export const deletePost = async (id: string) => {
  await axiosInstance.delete(`/post/${id}`);
};

export const likePost = async (postId: string, userId: string) => {
  const res = await fetch(`/api/posts/${postId}/like`, {
    method: 'PUT', // or POST, depending on your route
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }), // ← this is what the backend reads
  });
  if (!res.ok) throw new Error('Failed to like post');
  return res.json();
};

export const getPostsByUserId = async (userId: string) => {
  const response = await axiosInstance.get<PostInter[]>(`/post/user/${userId}`);
  return response.data;
};