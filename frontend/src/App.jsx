import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, ReceiptText, Users,
  Settings2, BookOpen, Menu, X, LogOut, Sun, Moon,
  FileText, PiggyBank, FileSpreadsheet, Package, Receipt,
  TrendingUp, CalendarDays,
} from 'lucide-react';
import clsx from 'clsx';

import { AuthProvider, useAuth }   from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage  from './components/auth/LoginPage';
import Dashboard  from './components/dashboard/Dashboard';
import Scanner    from './components/scanner/Scanner';
import Settings   from './components/settings/Settings';
import CoaLibrary from './components/coa/CoaLibrary';
import Ledger     from './components/ledger/Ledger';
import Investors  from './components/investors/Investors';
import Reports        from './components/reports/Reports';
import Budget         from './components/budget/Budget';
import Invoices       from './components/invoices/Invoices';
import Assets         from './components/assets/Assets';
import Tax            from './components/tax/Tax';
import MonthlyOpening from './components/monthly/MonthlyOpening';

// ─────────────────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/reports', icon: TrendingUp,      label: 'Laporan'   },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { to: '/scanner',  icon: ScanLine,    label: 'AI Scanner' },
      { to: '/ledger',   icon: ReceiptText, label: 'Ledger'     },
      { to: '/invoices', icon: FileText,    label: 'Invoice'    },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { to: '/monthly-opening', icon: CalendarDays,   label: 'Input Awal Bulan' },
      { to: '/budget',          icon: PiggyBank,       label: 'Budget'           },
      { to: '/tax',             icon: Receipt,         label: 'Pajak'            },
      { to: '/assets',          icon: Package,         label: 'Aset'             },
      { to: '/coa',             icon: FileSpreadsheet, label: 'Akun (COA)'       },
    ],
  },
  {
    label: 'Bisnis',
    items: [
      { to: '/investors', icon: Users, label: 'Investors' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
function Sidebar() {
  const [open, setOpen] = React.useState(true);
  const { user, logout }  = useAuth();
  const { dark, toggle }  = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    clsx(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
      isActive
        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
    );

  return (
    <aside className={clsx(
      'flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0',
      'glass border-r border-black/8 dark:border-white/5',
      open ? 'w-56' : 'w-16'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-black/6 dark:border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/30">
          <span className="text-white font-bold text-sm">PB</span>
        </div>
        {open && (
          <div className="overflow-hidden flex-1">
            <p className="text-slate-900 dark:text-white font-semibold text-sm leading-none">PhotoBooth</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Finance</p>
          </div>
        )}
        <button
          onClick={() => setOpen(p => !p)}
          className="ml-auto text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors shrink-0"
        >
          {open ? <X size={15} /> : <Menu size={15} />}
        </button>
      </div>

      {/* Sectioned nav */}
      <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {open && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                  <Icon size={17} className="shrink-0" />
                  {open && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 px-2 pb-3 pt-3 space-y-1 border-t border-black/6 dark:border-white/5">
        <NavLink to="/settings" className={navLinkClass}>
          <Settings2 size={17} className="shrink-0" />
          {open && <span>Settings</span>}
        </NavLink>

        {open && user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.02] border border-black/6 dark:border-white/5 mt-1">
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0">
              <span className="text-indigo-600 dark:text-indigo-300 text-[10px] font-bold uppercase">
                {user.username?.[0] ?? 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-700 dark:text-slate-300 text-xs font-medium truncate">{user.username}</p>
              <p className="text-slate-400 dark:text-slate-600 text-[10px]">Administrator</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-150"
        >
          <LogOut size={17} className="shrink-0" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function TopBar() {
  const { dark, toggle } = useTheme();
  return (
    <div className="sticky top-0 z-40 flex items-center justify-end px-6 py-2.5 glass border-b border-black/6 dark:border-white/5">
      <button
        onClick={toggle}
        title={dark ? 'Light Mode' : 'Dark Mode'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all"
      >
        {dark
          ? <><Sun size={13} className="text-amber-400" /><span>Light Mode</span></>
          : <><Moon size={13} className="text-indigo-500" /><span>Dark Mode</span></>
        }
      </button>
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto bg-slate-100 dark:bg-slate-950">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/scanner"   element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
            <Route path="/ledger"    element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
            <Route path="/coa"       element={<ProtectedRoute><CoaLibrary /></ProtectedRoute>} />
            <Route path="/investors" element={<ProtectedRoute><Investors /></ProtectedRoute>} />
            <Route path="/reports"   element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/budget"    element={<ProtectedRoute><Budget /></ProtectedRoute>} />
            <Route path="/invoices"  element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/assets"    element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            <Route path="/tax"             element={<ProtectedRoute><Tax /></ProtectedRoute>} />
            <Route path="/monthly-opening" element={<ProtectedRoute><MonthlyOpening /></ProtectedRoute>} />
            <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
