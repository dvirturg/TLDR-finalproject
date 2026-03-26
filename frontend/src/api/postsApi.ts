import axiosInstance from './axiosInstance';
import type { PostInter } from '../types';

export const getPosts = async (params?: { page?: number; limit?: number; q?: string }) => {
  const response = await axiosInstance.get<{ data: PostInter[]; pages: number }>('/posts', { params });
  return response.data;
};

export const getPostById = async (id: string) => {
  const response = await axiosInstance.get<PostInter>(`/posts/${id}`);
  return response.data;
};

export const createPost = async (data: FormData) => {
  const response = await axiosInstance.post<PostInter>('/posts', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updatePost = async (id: string, data: Partial<PostInter>) => {
  const response = await axiosInstance.put<PostInter>(`/posts/${id}`, data);
  return response.data;
};

export const deletePost = async (id: string) => {
  await axiosInstance.delete(`/posts/${id}`);
};

export const likePost = async (id: string) => {
  const response = await axiosInstance.post(`/posts/${id}/like`);
  return response.data;
};

export const getPostsByUserId = async (userId: string) => {
  const response = await axiosInstance.get<PostInter[]>(`/posts/user/${userId}`);
  return response.data;
};