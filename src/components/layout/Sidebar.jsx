import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserPlus, Shield, RefreshCw, CalendarCheck, 
  FileText, Percent, BookOpen, FileSpreadsheet, BarChart3, Activity, 
  UserCheck, Settings, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { currentUser, isAdmin, switchRole, logout } = useAuth();

  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Leads', path: '/leads', icon: UserPlus },
    { label: 'Policies', path: '/insurance', icon: Shield },
    { label: 'Renewals', path: '/renewals', icon: RefreshCw },
    { label: 'Follow-ups', path: '/followups', icon: CalendarCheck },
    { label: 'Document Vault', path: '/documents', icon: FileText }
  ];

  const financialNavItems = [
    { label: 'Commissions', path: '/commissions', icon: Percent },
    { label: 'Ledger', path: '/ledger', icon: BookOpen },
    { label: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Activity Logs', path: '/activity', icon: Activity }
  ];

  const adminNavItems = [
    { label: 'Agents & Team', path: '/team', icon: UserCheck },
    { label: 'Agency Settings', path: '/settings', icon: Settings }
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
      zIndex: 100,
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{
        height: 'var(--header-height)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 18px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '14px',
          letterSpacing: '-0.02em',
          boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)'
        }}>
          IN
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-main)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            INSecure
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Insurance CRM
          </span>
        </div>
      </div>

      {/* Role Switcher Pill */}
      <div style={{
        padding: '8px 12px',
        margin: '10px 10px 4px 10px',
        backgroundColor: 'var(--color-bg)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isAdmin ? 'var(--color-accent)' : 'var(--color-success)'
          }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)' }}>
            {isAdmin ? 'ADMIN' : 'AGENT'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '3px' }}>
          <button
            onClick={() => switchRole('admin')}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '500',
              borderRadius: '4px',
              backgroundColor: isAdmin ? 'var(--color-surface)' : 'transparent',
              color: isAdmin ? 'var(--color-text-main)' : 'var(--color-text-muted)',
              border: isAdmin ? '1px solid var(--color-border)' : '1px solid transparent',
              boxShadow: isAdmin ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Admin
          </button>
          <button
            onClick={() => switchRole('agent')}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '500',
              borderRadius: '4px',
              backgroundColor: !isAdmin ? 'var(--color-surface)' : 'transparent',
              color: !isAdmin ? 'var(--color-text-main)' : 'var(--color-text-muted)',
              border: !isAdmin ? '1px solid var(--color-border)' : '1px solid transparent',
              boxShadow: !isAdmin ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Agent
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ flex: 1, padding: '6px 10px', overflowY: 'auto' }}>
        {/* Section: Main Operations */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            padding: '4px 8px 6px 8px',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-light)'
          }}>
            Operations
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-body)',
                      backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {isActive && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section: Financials & Reports */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            padding: '4px 8px 6px 8px',
            fontSize: '10px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-light)'
          }}>
            Financials
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {financialNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '9px',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      fontWeight: isActive ? '600' : '500',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-body)',
                      backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                      transition: 'all 0.15s ease'
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {isActive && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section: Admin (Conditional) */}
        {isAdmin && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              padding: '4px 8px 6px 8px',
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-text-light)'
            }}>
              Administration
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-body)',
                        backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                        transition: 'all 0.15s ease'
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} />
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {isActive && <ChevronRight size={13} style={{ opacity: 0.6 }} />}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--color-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            flexShrink: 0
          }}>
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Authorized User'}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.email || 'agent@insecure.in'}
            </div>
          </div>
        </div>

        {logout && (
          <button 
            onClick={logout}
            title="Sign out"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};
