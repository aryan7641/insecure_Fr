import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, Shield, RefreshCw, CalendarCheck, 
  FileText, Percent, BookOpen, FileSpreadsheet, BarChart3, Activity, 
  UserCheck, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { currentUser, isAdmin, switchRole } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Leads', path: '/leads', icon: UserPlus },
    { label: 'Policies', path: '/insurance', icon: Shield },
    { label: 'Renewals', path: '/renewals', icon: RefreshCw },
    { label: 'Follow-ups', path: '/followups', icon: CalendarCheck },
    { label: 'Document Vault', path: '/documents', icon: FileText },
    { label: 'Commissions', path: '/commissions', icon: Percent },
    { label: 'Ledger', path: '/ledger', icon: BookOpen },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Activity Logs', path: '/activity', icon: Activity },
    { label: 'Agents & Team', path: '/team', icon: UserCheck, adminOnly: true },
    { label: 'Settings', path: '/settings', icon: Settings, adminOnly: true }
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      backgroundColor: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      {/* Brand Logo */}
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '0 20px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '16px'
        }}>
          IN
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.1 }}>INSecure</h1>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Insurance CRM</span>
        </div>
      </div>

      {/* Role Toggle Banner */}
      <div style={{
        padding: '10px 14px',
        margin: '10px 12px 4px 12px',
        backgroundColor: 'var(--color-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>Active Role:</span>
          <span className={`badge ${isAdmin ? 'badge-info' : 'badge-neutral'}`}>
            {isAdmin ? 'ADMIN' : 'AGENT'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className={`btn btn-sm ${isAdmin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
            onClick={() => switchRole('admin')}
          >
            Admin View
          </button>
          <button 
            className={`btn btn-sm ${!isAdmin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
            onClick={() => switchRole('agent')}
          >
            Agent View
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '500',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    backgroundColor: isActive ? 'var(--color-surface-hover)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <Icon size={16} color={({ isActive }) => isActive ? 'var(--color-accent)' : 'currentColor'} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-accent)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          fontSize: '13px'
        }}>
          {currentUser?.name?.charAt(0) || 'U'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentUser?.name || 'Insurance Agent'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentUser?.email}
          </p>
        </div>
      </div>
    </aside>
  );
};
