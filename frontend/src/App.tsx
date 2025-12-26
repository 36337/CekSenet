// ============================================
// ÇekSenet - Main App Component
// Application routing and providers
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts'
import { ProtectedRoute, ApplicationLayout } from '@/components'
import { AppInitializer } from '@/components/AppInitializer'
import { LoginPage, SetupPage, DashboardPage, EvraklarPage, CarilerPage } from '@/pages'
import { EvrakEklePage, EvrakDetayPage, EvrakDuzenlePage } from '@/pages/evraklar'
import { CariEklePage, CariDetayPage, CariDuzenlePage } from '@/pages/cariler'
import { KullanicilarPage, ProfilPage } from '@/pages/ayarlar'

// Placeholder pages (will be replaced with real pages later)
import {
  RaporlarPage,
  AyarlarPage,
  YedeklemePage,
} from '@/pages/placeholders'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInitializer>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />

          {/* Protected Routes - With Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <DashboardPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />

          {/* Evraklar */}
          <Route
            path="/evraklar"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <EvraklarPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evraklar/yeni"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <EvrakEklePage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evraklar/:id"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <EvrakDetayPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/evraklar/:id/duzenle"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <EvrakDuzenlePage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />

          {/* Cariler */}
          <Route
            path="/cariler"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <CarilerPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cariler/yeni"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <CariEklePage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cariler/:id"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <CariDetayPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cariler/:id/duzenle"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <CariDuzenlePage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />

          {/* Raporlar */}
          <Route
            path="/raporlar"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <RaporlarPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />

          {/* Ayarlar */}
          <Route
            path="/ayarlar"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <AyarlarPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/profil"
            element={
              <ProtectedRoute>
                <ApplicationLayout>
                  <ProfilPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/ayarlar/kullanicilar"
            element={
              <ProtectedRoute requireAdmin>
                <ApplicationLayout>
                  <KullanicilarPage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ayarlar/yedekleme"
            element={
              <ProtectedRoute requireAdmin>
                <ApplicationLayout>
                  <YedeklemePage />
                </ApplicationLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AppInitializer>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
