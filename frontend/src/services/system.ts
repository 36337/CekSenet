/**
 * System API Service
 * Sistem bilgileri API çağrıları
 */

import api from './api'

// ============================================
// Types
// ============================================

export interface NetworkInterface {
  address: string
  netmask: string
  mac: string
}

export interface SystemIPInfo {
  hostname: string
  interfaces: Record<string, NetworkInterface[]>
  primaryIP: string | null
  port: number
  accessUrls: {
    local: string
    lan: string | null
  }
}

// ============================================
// API Functions
// ============================================

/**
 * Sistem IP bilgilerini getir (sadece admin)
 */
export async function getSystemIP(): Promise<SystemIPInfo> {
  const response = await api.get<SystemIPInfo>('/system/ip')
  return response.data
}

/**
 * Sistem sağlık kontrolü
 */
export async function getSystemHealth(): Promise<{
  status: string
  timestamp: string
  uptime: number
}> {
  const response = await api.get('/system/health')
  return response.data
}
