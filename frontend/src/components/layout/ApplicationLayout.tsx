// ============================================
// ÇekSenet - Application Layout
// Main layout with sidebar and navbar
// ============================================

import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks'
import { SidebarLayout } from '@/components/ui/sidebar-layout'
import {
  Sidebar,
  SidebarHeader,
  SidebarBody,
  SidebarFooter,
  SidebarSection,
  SidebarItem,
  SidebarLabel,
  SidebarSpacer,
  SidebarDivider,
} from '@/components/ui/sidebar'
import {
  Navbar,
  NavbarSection,
  NavbarSpacer,
  NavbarItem,
} from '@/components/ui/navbar'
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
} from '@/components/ui/dropdown'
import { Avatar } from '@/components/ui/avatar'

// Heroicons
import {
  HomeIcon,
  DocumentTextIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  CloudArrowUpIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid'

// ============================================
// Types
// ============================================

interface ApplicationLayoutProps {
  children: React.ReactNode
}

// ============================================
// Main Component
// ============================================

export function ApplicationLayout({ children }: ApplicationLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()

  // Current path for active state
  const pathname = location.pathname

  // Handle logout
  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <SidebarLayout
      sidebar={
        <AppSidebar
          pathname={pathname}
          isAdmin={isAdmin}
          user={user}
          onLogout={handleLogout}
        />
      }
      navbar={
        <AppNavbar
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          getInitials={getInitials}
        />
      }
    >
      {children}
    </SidebarLayout>
  )
}

// ============================================
// Sidebar Component
// ============================================

interface AppSidebarProps {
  pathname: string
  isAdmin: boolean
  user: { ad_soyad: string; rol: string } | null
  onLogout: () => void
}

function AppSidebar({ pathname, isAdmin, user, onLogout }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        {/* App Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <DocumentTextIcon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-base font-semibold text-zinc-950 dark:text-white">
              ÇekSenet
            </span>
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              Takip Sistemi
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarBody>
        {/* Main Navigation */}
        <SidebarSection>
          <SidebarItem href="/" current={pathname === '/'}>
            <HomeIcon data-slot="icon" />
            <SidebarLabel>Dashboard</SidebarLabel>
          </SidebarItem>

          <SidebarItem
            href="/evraklar"
            current={pathname.startsWith('/evraklar')}
          >
            <DocumentTextIcon data-slot="icon" />
            <SidebarLabel>Evraklar</SidebarLabel>
          </SidebarItem>

          <SidebarItem
            href="/cariler"
            current={pathname.startsWith('/cariler')}
          >
            <UsersIcon data-slot="icon" />
            <SidebarLabel>Cariler</SidebarLabel>
          </SidebarItem>

          <SidebarItem
            href="/raporlar"
            current={pathname.startsWith('/raporlar')}
          >
            <ChartBarIcon data-slot="icon" />
            <SidebarLabel>Raporlar</SidebarLabel>
          </SidebarItem>
        </SidebarSection>

        <SidebarSpacer />

        {/* Settings Section */}
        <SidebarSection>
          <SidebarItem
            href="/ayarlar"
            current={pathname === '/ayarlar'}
          >
            <Cog6ToothIcon data-slot="icon" />
            <SidebarLabel>Ayarlar</SidebarLabel>
          </SidebarItem>

          {/* Admin Only Links */}
          {isAdmin && (
            <>
              <SidebarItem
                href="/ayarlar/kullanicilar"
                current={pathname === '/ayarlar/kullanicilar'}
              >
                <UserGroupIcon data-slot="icon" />
                <SidebarLabel>Kullanıcılar</SidebarLabel>
              </SidebarItem>

              <SidebarItem
                href="/ayarlar/yedekleme"
                current={pathname === '/ayarlar/yedekleme'}
              >
                <CloudArrowUpIcon data-slot="icon" />
                <SidebarLabel>Yedekleme</SidebarLabel>
              </SidebarItem>
            </>
          )}
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter>
        <SidebarDivider />
        
        {/* User Info */}
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar
            initials={user?.ad_soyad ? user.ad_soyad.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
            className="size-8 bg-blue-600 text-white"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-zinc-950 dark:text-white">
              {user?.ad_soyad || 'Kullanıcı'}
            </div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {user?.rol === 'admin' ? 'Yönetici' : 'Kullanıcı'}
            </div>
          </div>
        </div>

        <SidebarSection>
          <SidebarItem href="/ayarlar/profil">
            <UserCircleIcon data-slot="icon" />
            <SidebarLabel>Profil</SidebarLabel>
          </SidebarItem>
          
          <SidebarItem onClick={onLogout}>
            <ArrowRightStartOnRectangleIcon data-slot="icon" />
            <SidebarLabel>Çıkış Yap</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarFooter>
    </Sidebar>
  )
}

// ============================================
// Navbar Component (Mobile)
// ============================================

interface AppNavbarProps {
  user: { ad_soyad: string; rol: string } | null
  isAdmin: boolean
  onLogout: () => void
  getInitials: (name: string) => string
}

function AppNavbar({ user, isAdmin, onLogout, getInitials }: AppNavbarProps) {
  return (
    <Navbar>
      <NavbarSpacer />

      <NavbarSection>
        {/* User Dropdown */}
        <Dropdown>
          <DropdownButton as={NavbarItem}>
            <Avatar
              initials={user?.ad_soyad ? getInitials(user.ad_soyad) : '?'}
              className="size-8 bg-blue-600 text-white"
            />
            <span className="hidden sm:block">{user?.ad_soyad || 'Kullanıcı'}</span>
            <ChevronDownIcon data-slot="icon" />
          </DropdownButton>

          <DropdownMenu anchor="bottom end">
            <div className="px-3.5 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 sm:px-3">
              {user?.rol === 'admin' ? 'Yönetici' : 'Kullanıcı'}
            </div>

            <DropdownDivider />

            <DropdownItem href="/ayarlar/profil">
              <UserCircleIcon data-slot="icon" />
              Profil
            </DropdownItem>

            <DropdownItem href="/ayarlar">
              <Cog6ToothIcon data-slot="icon" />
              Ayarlar
            </DropdownItem>

            {isAdmin && (
              <>
                <DropdownDivider />
                <DropdownItem href="/ayarlar/kullanicilar">
                  <UserGroupIcon data-slot="icon" />
                  Kullanıcılar
                </DropdownItem>
                <DropdownItem href="/ayarlar/yedekleme">
                  <CloudArrowUpIcon data-slot="icon" />
                  Yedekleme
                </DropdownItem>
              </>
            )}

            <DropdownDivider />

            <DropdownItem onClick={onLogout}>
              <ArrowRightStartOnRectangleIcon data-slot="icon" />
              Çıkış Yap
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarSection>
    </Navbar>
  )
}

export default ApplicationLayout
