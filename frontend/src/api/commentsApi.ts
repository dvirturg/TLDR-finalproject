import axiosInstance from './axiosInstance';
import type { CommentInter } from '../types';

export const getCommentsByPost = async (postId: string) => {
  const response = await axiosInstance.get<CommentInter[]>(`/comments/post/${postId}`);
  return response.data;
};

export const createComment = async (data: { text: string; postId: string }) => {
  const response = await axiosInstance.post<CommentInter>('/comments', data);
  return response.data;
};

export const getCommentById = async (id: string) => {
  const response = await axiosInstance.get<CommentInter>(`/comments/${id}`);
  return response.data;
};

export const updateComment = async (id: string, data: { text: string }) => {
  const response = await axiosInstance.put<CommentInter>(`/comments/${id}`, data);
  return response.data;
};

export const deleteComment = async (id: string) => {
  await axiosInstance.delete(`/comments/${id}`);
};