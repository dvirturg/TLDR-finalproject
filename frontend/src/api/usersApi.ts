import axiosInstance from './axiosInstance';
import type { UserProfileData } from '../types';

export const getUserById = async (id: string) => {
  const response = await axiosInstance.get<UserProfileData>(`/users/${id}`);
  return response.data;
};

export const updateUser = async (id: string, data: FormData) => {
  const response = await axiosInstance.put<UserProfileData>(`/users/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteUser = async (id: string) => {
  await axiosInstance.delete(`/users/${id}`);
};

export const getUserPosts = async (id: string) => {
  const response = await axiosInstance.get(`/users/${id}/posts`);
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await axiosInstance.get<UserProfileData[]>('/users/search', { params: { q: query } });
  return response.data;
};