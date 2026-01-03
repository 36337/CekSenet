// ============================================
// ÇekSenet - Kullanıcı Yönetimi Sayfası
// Admin only - Kullanıcı CRUD işlemleri
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field, FieldGroup, Label, ErrorMessage } from '@/components/ui/fieldset'
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from '@/components/ui/dialog'
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from '@/components/ui/dropdown'
import {
  UserGroupIcon,
  PlusIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'
import { useAuth } from '@/contexts'
import {
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
  type User,
  type UserFormData,
} from '@/services'

// ============================================
// Types
// ============================================

interface FormErrors {
  username?: string
  password?: string
  ad_soyad?: string
  role?: string
  general?: string
}

type ModalMode = 'create' | 'edit' | 'password' | 'delete' | null

// ============================================
// Component
// ============================================

export function KullanicilarPage() {
  const { user: currentUser } = useAuth()

  // Liste state
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    ad_soyad: '',
    role: 'normal',
  })
  const [newPassword, setNewPassword] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // ============================================
  // Data Fetching
  // ============================================

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getUsers()
      setUsers(response.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenirken hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // ============================================
  // Modal Handlers
  // ============================================

  const openCreateModal = () => {
    setFormData({
      username: '',
      password: '',
      ad_soyad: '',
      role: 'normal',
    })
    setFormErrors({})
    setSelectedUser(null)
    setModalMode('create')
  }

  const openEditModal = (user: User) => {
    setFormData({
      username: user.username,
      ad_soyad: user.ad_soyad,
      role: user.role,
    })
    setFormErrors({})
    setSelectedUser(user)
    setModalMode('edit')
  }

  const openPasswordModal = (user: User) => {
    setNewPassword('')
    setFormErrors({})
    setSelectedUser(user)
    setModalMode('password')
  }

  const openDeleteModal = (user: User) => {
    setFormErrors({})
    setSelectedUser(user)
    setModalMode('delete')
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedUser(null)
    setFormErrors({})
  }

  // ============================================
  // Validation
  // ============================================

  const validateCreateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.username.trim()) {
      errors.username = 'Kullanıcı adı gerekli'
    } else if (formData.username.length < 3) {
      errors.username = 'En az 3 karakter olmalı'
    } else if (formData.username.length > 50) {
      errors.username = 'En fazla 50 karakter olabilir'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Sadece harf, rakam ve alt çizgi kullanılabilir'
    }

    if (!formData.password) {
      errors.password = 'Şifre gerekli'
    } else if (formData.password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalı'
    }

    if (!formData.ad_soyad.trim()) {
      errors.ad_soyad = 'Ad soyad gerekli'
    } else if (formData.ad_soyad.length < 2) {
      errors.ad_soyad = 'En az 2 karakter olmalı'
    } else if (formData.ad_soyad.length > 100) {
      errors.ad_soyad = 'En fazla 100 karakter olabilir'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEditForm = (): boolean => {
    const errors: FormErrors = {}

    if (!formData.ad_soyad.trim()) {
      errors.ad_soyad = 'Ad soyad gerekli'
    } else if (formData.ad_soyad.length < 2) {
      errors.ad_soyad = 'En az 2 karakter olmalı'
    } else if (formData.ad_soyad.length > 100) {
      errors.ad_soyad = 'En fazla 100 karakter olabilir'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordForm = (): boolean => {
    const errors: FormErrors = {}

    if (!newPassword) {
      errors.password = 'Yeni şifre gerekli'
    } else if (newPassword.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalı'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ============================================
  // Form Handlers
  // ============================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCreateSubmit = async () => {
    if (!validateCreateForm()) return

    setIsSubmitting(true)
    setFormErrors({})

    try {
      await createUser(formData)
      closeModal()
      fetchUsers()
    } catch (err: any) {
      setFormErrors({ general: err?.message || 'Kullanıcı oluşturulamadı' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedUser || !validateEditForm()) return

    setIsSubmitting(true)
    setFormErrors({})

    try {
      await updateUser(selectedUser.id, {
        ad_soyad: formData.ad_soyad,
        role: formData.role,
      })
      closeModal()
      fetchUsers()
    } catch (err: any) {
      setFormErrors({ general: err?.message || 'Kullanıcı güncellenemedi' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async () => {
    if (!selectedUser || !validatePasswordForm()) return

    setIsSubmitting(true)
    setFormErrors({})

    try {
      await resetUserPassword(selectedUser.id, newPassword)
      closeModal()
    } catch (err: any) {
      setFormErrors({ general: err?.message || 'Şifre sıfırlanamadı' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    setFormErrors({})

    try {
      await deleteUser(selectedUser.id)
      closeModal()
      fetchUsers()
    } catch (err: any) {
      setFormErrors({ general: err?.message || 'Kullanıcı silinemedi' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ============================================
  // Render Helpers
  // ============================================

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isCurrentUser = (user: User) => currentUser?.id === user.id

  // ============================================
  // Render - Loading
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  // ============================================
  // Render - Error
  // ============================================

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <Text className="mt-4 text-red-700">{error}</Text>
        <Button className="mt-4" onClick={fetchUsers}>
          Tekrar Dene
        </Button>
      </div>
    )
  }

  // ============================================
  // Render - Main
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <UserGroupIcon className="h-6 w-6" />
          </div>
          <div>
            <Heading>Kullanıcı Yönetimi</Heading>
            <Text className="mt-1">Sistem kullanıcılarını yönetin</Text>
          </div>
        </div>
        <Button color="purple" onClick={openCreateModal}>
          <PlusIcon className="h-5 w-5" />
          Yeni Kullanıcı
        </Button>
      </div>

      {/* Kullanıcı Tablosu */}
      <div className="rounded-lg border border-zinc-200 bg-white">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Kullanıcı Adı</TableHeader>
              <TableHeader>Ad Soyad</TableHeader>
              <TableHeader>Rol</TableHeader>
              <TableHeader>Son Giriş</TableHeader>
              <TableHeader>Kayıt Tarihi</TableHeader>
              <TableHeader className="w-12"></TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <Text className="text-zinc-500">Henüz kullanıcı bulunmuyor.</Text>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                    {isCurrentUser(user) && (
                      <Badge color="blue" className="ml-2">
                        Sen
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.ad_soyad}</TableCell>
                  <TableCell>
                    <Badge color={USER_ROLE_COLORS[user.role] as any}>
                      {USER_ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {formatDateTime(user.last_login)}
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {formatDateTime(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownButton plain aria-label="İşlemler">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </DropdownButton>
                      <DropdownMenu anchor="bottom end">
                        <DropdownItem onClick={() => openEditModal(user)}>
                          <PencilSquareIcon className="h-4 w-4" />
                          Düzenle
                        </DropdownItem>
                        <DropdownItem onClick={() => openPasswordModal(user)}>
                          <KeyIcon className="h-4 w-4" />
                          Şifre Sıfırla
                        </DropdownItem>
                        {!isCurrentUser(user) && (
                          <DropdownItem onClick={() => openDeleteModal(user)}>
                            <TrashIcon className="h-4 w-4" />
                            Sil
                          </DropdownItem>
                        )}
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Kullanıcı Ekleme Modal */}
      <Dialog open={modalMode === 'create'} onClose={closeModal}>
        <DialogTitle>Yeni Kullanıcı</DialogTitle>
        <DialogDescription>Sisteme yeni bir kullanıcı ekleyin.</DialogDescription>

        <DialogBody>
          {formErrors.general && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formErrors.general}
            </div>
          )}

          <FieldGroup>
            <Field>
              <Label>Kullanıcı Adı *</Label>
              <Input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="ornekkullanici"
                invalid={!!formErrors.username}
              />
              {formErrors.username && <ErrorMessage>{formErrors.username}</ErrorMessage>}
            </Field>

            <Field>
              <Label>Şifre *</Label>
              <Input
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder="En az 6 karakter"
                invalid={!!formErrors.password}
              />
              {formErrors.password && <ErrorMessage>{formErrors.password}</ErrorMessage>}
            </Field>

            <Field>
              <Label>Ad Soyad *</Label>
              <Input
                name="ad_soyad"
                type="text"
                value={formData.ad_soyad}
                onChange={handleChange}
                placeholder="Ahmet Yılmaz"
                invalid={!!formErrors.ad_soyad}
              />
              {formErrors.ad_soyad && <ErrorMessage>{formErrors.ad_soyad}</ErrorMessage>}
            </Field>

            <Field>
              <Label>Rol *</Label>
              <Select name="role" value={formData.role} onChange={handleChange}>
                {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </FieldGroup>
        </DialogBody>

        <DialogActions>
          <Button outline onClick={closeModal} disabled={isSubmitting}>
            İptal
          </Button>
          <Button color="purple" onClick={handleCreateSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Oluşturuluyor...' : 'Kullanıcı Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kullanıcı Düzenleme Modal */}
      <Dialog open={modalMode === 'edit'} onClose={closeModal}>
        <DialogTitle>Kullanıcı Düzenle</DialogTitle>
        <DialogDescription>
          <span className="font-semibold">{selectedUser?.username}</span> kullanıcısını düzenleyin.
        </DialogDescription>

        <DialogBody>
          {formErrors.general && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formErrors.general}
            </div>
          )}

          <FieldGroup>
            <Field>
              <Label>Kullanıcı Adı</Label>
              <Input
                type="text"
                value={selectedUser?.username || ''}
                disabled
                className="bg-zinc-100"
              />
              <Text className="mt-1 text-sm text-zinc-500">Kullanıcı adı değiştirilemez</Text>
            </Field>

            <Field>
              <Label>Ad Soyad *</Label>
              <Input
                name="ad_soyad"
                type="text"
                value={formData.ad_soyad}
                onChange={handleChange}
                placeholder="Ahmet Yılmaz"
                invalid={!!formErrors.ad_soyad}
              />
              {formErrors.ad_soyad && <ErrorMessage>{formErrors.ad_soyad}</ErrorMessage>}
            </Field>

            <Field>
              <Label>Rol *</Label>
              <Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={selectedUser ? isCurrentUser(selectedUser) : false}
              >
                {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              {selectedUser && isCurrentUser(selectedUser) && (
                <Text className="mt-1 text-sm text-zinc-500">
                  Kendi rolünüzü değiştiremezsiniz
                </Text>
              )}
            </Field>
          </FieldGroup>
        </DialogBody>

        <DialogActions>
          <Button outline onClick={closeModal} disabled={isSubmitting}>
            İptal
          </Button>
          <Button color="purple" onClick={handleEditSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Şifre Sıfırlama Modal */}
      <Dialog open={modalMode === 'password'} onClose={closeModal}>
        <DialogTitle>Şifre Sıfırla</DialogTitle>
        <DialogDescription>
          <span className="font-semibold">{selectedUser?.username}</span> kullanıcısının şifresini
          sıfırlayın.
        </DialogDescription>

        <DialogBody>
          {formErrors.general && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formErrors.general}
            </div>
          )}

          <Field>
            <Label>Yeni Şifre *</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (formErrors.password) {
                  setFormErrors((prev) => ({ ...prev, password: undefined }))
                }
              }}
              placeholder="En az 6 karakter"
              invalid={!!formErrors.password}
            />
            {formErrors.password && <ErrorMessage>{formErrors.password}</ErrorMessage>}
          </Field>
        </DialogBody>

        <DialogActions>
          <Button outline onClick={closeModal} disabled={isSubmitting}>
            İptal
          </Button>
          <Button color="amber" onClick={handlePasswordSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kullanıcı Silme Modal */}
      <Dialog open={modalMode === 'delete'} onClose={closeModal}>
        <DialogTitle>
          <div className="flex items-center gap-2 text-red-600">
            <TrashIcon className="h-6 w-6" />
            Kullanıcıyı Sil
          </div>
        </DialogTitle>
        <DialogDescription>
          <span className="font-semibold">{selectedUser?.username}</span> ({selectedUser?.ad_soyad})
          kullanıcısını silmek istediğinize emin misiniz?
        </DialogDescription>

        <DialogBody>
          {formErrors.general && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formErrors.general}
            </div>
          )}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <strong>Uyarı:</strong> Bu işlem geri alınamaz. Kullanıcının tüm oturum bilgileri
            silinecektir.
          </div>
        </DialogBody>

        <DialogActions>
          <Button outline onClick={closeModal} disabled={isSubmitting}>
            İptal
          </Button>
          <Button color="red" onClick={handleDeleteSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Siliniyor...' : 'Evet, Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default KullanicilarPage
