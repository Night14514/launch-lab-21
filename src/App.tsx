import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireRole } from './components/guards';
import { RoleSelectScreen } from './screens/RoleSelectScreen';
import { PeerHomeScreen } from './screens/peer/PeerHomeScreen';
import { ProjectWizardScreen } from './screens/peer/ProjectWizardScreen';
import { ModuleScreen } from './screens/peer/ModuleScreen';
import { OnePagerScreen } from './screens/OnePagerScreen';
import { PresentScreen } from './screens/PresentScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { CuratorDashboardScreen } from './screens/curator/CuratorDashboardScreen';
import { CuratorProjectScreen } from './screens/curator/CuratorProjectScreen';
import { TemplatesScreen } from './screens/curator/TemplatesScreen';

/**
 * Маршруты. Секции /peer и /curator закрыты RequireRole; внутри экранов все данные идут через селекторы,
 * а те — через canAccess. Глубокая ссылка на чужой проект у пира упирается в AccessDenied.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<RoleSelectScreen />} />
        <Route path="/present/:projectId" element={<PresentScreen />} />

        <Route element={<AppShell />}>
          <Route path="/peer" element={<RequireRole role="peer" />}>
            <Route index element={<PeerHomeScreen />} />
            <Route path="new" element={<ProjectWizardScreen mode="create" />} />
            <Route path="profile" element={<ProjectWizardScreen mode="edit" />} />
            <Route path="module/:moduleId" element={<ModuleScreen />} />
            <Route path="onepager" element={<OnePagerScreen scope="peer" />} />
            <Route path="activity" element={<ActivityScreen scope="peer" />} />
          </Route>

          <Route path="/curator" element={<RequireRole role="curator" />}>
            <Route index element={<CuratorDashboardScreen />} />
            <Route path="project/:projectId" element={<CuratorProjectScreen />} />
            <Route path="project/:projectId/onepager" element={<OnePagerScreen scope="curator" />} />
            <Route path="templates" element={<TemplatesScreen />} />
            <Route path="templates/:moduleId" element={<TemplatesScreen />} />
            <Route path="activity" element={<ActivityScreen scope="curator" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
