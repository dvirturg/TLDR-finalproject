import axiosInstance from './axiosInstance';
import type { UserProfileData } from '../types';

export const getUserById = async (id: string) => {
  const response = await axiosInstance.get<UserProfileData>(`/user/${id}`);
  return response.data;
};

export const updateUser = async (id: string, data: FormData) => {
  const response = await axiosInstance.put<UserProfileData>(`/user/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteUser = async (id: string) => {
  await axiosInstance.delete(`/user/${id}`);
};

export const getUserPosts = async (id: string) => {
  const response = await axiosInstance.get(`/user/${id}/posts`);
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await axiosInstance.get<UserProfileData[]>('/user/search', { params: { q: query } });
  return response.data;
};