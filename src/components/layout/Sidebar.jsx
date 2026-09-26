import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Shield, TrendingUp, CalendarCheck, 
  FileText, BarChart3, UploadCloud, Activity, Settings, UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { currentUser, isAdmin, switchRole } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Insurance Policies', path: '/insurance', icon: Shield },
    { label: 'Follow-ups & Renewals', path: '/followups', icon: CalendarCheck },
    { label: 'Document Vault', path: '/documents', icon: FileText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Imports', path: '/imports', icon: UploadCloud },
    { label: 'Activity Logs', path: '/activity', icon: Activity },
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
        padding: '12px 16px',
        margin: '12px',
        backgroundColor: 'var(--color-bg)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-border)',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-text-muted)', fontWeight: '600' }}>Role View:</span>
          <span className={`badge ${isAdmin ? 'badge-info' : 'badge-neutral'}`}>
            {currentUser?.role}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            className={`btn btn-sm ${isAdmin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
            onClick={() => switchRole('Admin')}
          >
            Admin
          </button>
          <button 
            className={`btn btn-sm ${!isAdmin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '11px', padding: '2px 4px' }}
            onClick={() => switchRole('Agent')}
          >
            Agent
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-main)',
                backgroundColor: isActive ? 'var(--color-accent-light)' : 'transparent',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '4px',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          color: 'var(--color-primary)'
        }}>
          {currentUser?.name.charAt(0)}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentUser?.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {currentUser?.email}
          </div>
        </div>
      </div>
    </aside>
  );
};
