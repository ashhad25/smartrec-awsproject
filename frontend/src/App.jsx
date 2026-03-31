// App.jsx
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BrowsePage from './pages/BrowsePage.jsx';
import ForYouPage from './pages/ForYouPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import AlgorithmPage from './pages/AlgorithmPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import SystemPage from './pages/SystemPage.jsx';
import { Spinner } from './components/ui.jsx';

function AppShell() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState('browse');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header activeTab={tab} setActiveTab={setTab} onToggleSidebar={tab === 'browse' ? () => setSidebarOpen(o => !o) : null} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {tab === 'browse' && <BrowsePage sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
        {tab === 'foryou'    && <ForYouPage />}
        {tab === 'history'   && <HistoryPage />}
        {tab === 'algorithm' && <AlgorithmPage />}
        {tab === 'admin'     && <AdminPage />}
        {tab === 'system'    && <SystemPage />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
