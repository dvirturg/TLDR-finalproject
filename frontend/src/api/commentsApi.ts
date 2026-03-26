import axiosInstance from './axiosInstance';
import type { CommentInter } from '../types';

export const getCommentsByPost = async (postId: string) => {
  const response = await axiosInstance.get<CommentInter[]>(`/comment/post/${postId}`);
  return response.data;
};

export const createComment = async (data: { text: string; postId: string; author: string }) => {
  const response = await axiosInstance.post<CommentInter>('/comment', data);
  return response.data;
};

export const getCommentById = async (id: string) => {
  const response = await axiosInstance.get<CommentInter>(`/comment/${id}`);
  return response.data;
};

export const updateComment = async (id: string, data: { text: string }) => {
  const response = await axiosInstance.put<CommentInter>(`/comment/${id}`, data);
  return response.data;
};

export const deleteComment = async (id: string) => {
  await axiosInstance.delete(`/comment/${id}`);
};