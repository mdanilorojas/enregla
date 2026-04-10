import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlassBackground } from '@/components/ui';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative">
      <GlassBackground />
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`lg:block ${mobileOpen ? 'block' : 'hidden'}`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      <div className={`transition-all duration-200 ${collapsed ? 'lg:ml-[64px]' : 'lg:ml-[252px]'}`}>
        <TopBar onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-6 lg:p-8 max-w-[1400px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
