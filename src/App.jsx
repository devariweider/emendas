import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { InstituicaoProvider } from './core/InstituicaoContext';
import { EmendasProvider } from './emendas/EmendasContext';
import { ToastProvider } from './core/ToastContext';
import LoginPage from './auth/LoginPage';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './core/Layout';
import DashboardPage from './dashboard/DashboardPage';
import EmendasPage from './emendas/EmendasPage';
import GraficosPage from './graficos/GraficosPage';
import RelatoriosPage from './relatorios/RelatoriosPage';
import ConfiguracoesPage from './configuracoes/ConfiguracoesPage';
import HistoricoPage from './historico/HistoricoPage';
import BackupPage from './backup/BackupPage';

function RotasProtegidas() {
  const { usuario } = useAuth();

  return (
    <InstituicaoProvider>
      <Routes>
        <Route
          path="/login"
          element={usuario ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          element={
            <ProtectedRoute>
              <EmendasProvider>
                <ToastProvider>
                  <Layout />
                </ToastProvider>
              </EmendasProvider>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/emendas" element={<EmendasPage />} />
          <Route path="/graficos" element={<GraficosPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/historico" element={<HistoricoPage />} />
          <Route path="/backup" element={<BackupPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </InstituicaoProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RotasProtegidas />
      </AuthProvider>
    </BrowserRouter>
  );
}
