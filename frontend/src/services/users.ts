// ============================================
// ÇekSenet - Users Service
// Kullanıcı yönetimi API işlemleri (Admin only)
// ============================================

import api from './api'

// ============================================
// Types
// ============================================

export type UserRole = 'admin' | 'normal'

export interface User {
  id: number
  username: string
  ad_soyad: string
  role: UserRole
  created_at: string
  last_login: string | null
}

export interface UserFormData {
  username: string
  password?: string
  ad_soyad: string
  role: UserRole
}

export interface UsersListResponse {
  count: number
  users: User[]
}

// ============================================
// Rol Sabitleri
// ============================================

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Yönetici',
  normal: 'Normal',
}

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  admin: 'purple',
  normal: 'zinc',
}

// ============================================
// API Functions
// ============================================

/**
 * Kullanıcı listesi getir (Admin only)
 */
export async function getUsers(): Promise<UsersListResponse> {
  const response = await api.get<UsersListResponse>('/users')
  return response.data
}

/**
 * Tek kullanıcı detayı getir (Admin only)
 */
export async function getUser(id: number): Promise<User> {
  const response = await api.get<User>(`/users/${id}`)
  return response.data
}

/**
 * Yeni kullanıcı oluştur (Admin only)
 */
export async function createUser(data: UserFormData): Promise<{ message: string; user: User }> {
  const response = await api.post<{ message: string; user: User }>('/users', data)
  return response.data
}

/**
 * Kullanıcı güncelle (Admin only)
 */
export async function updateUser(
  id: number, 
  data: Partial<Omit<UserFormData, 'password'>>
): Promise<{ message: string; user: User }> {
  const response = await api.put<{ message: string; user: User }>(`/users/${id}`, data)
  return response.data
}

/**
 * Kullanıcı şifresini sıfırla (Admin only)
 */
export async function resetUserPassword(
  id: number, 
  newPassword: string
): Promise<{ message: string }> {
  const response = await api.put<{ message: string }>(`/users/${id}/password`, {
    newPassword,
  })
  return response.data
}

/**
 * Kullanıcı sil (Admin only)
 */
export async function deleteUser(id: number): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/users/${id}`)
  return response.data
}
