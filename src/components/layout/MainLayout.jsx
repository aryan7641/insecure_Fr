import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CustomerFormModal } from '../customers/CustomerFormModal';

export const MainLayout = () => {
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        {/* Top Header */}
        <Header onOpenCustomerModal={() => setIsCustomerModalOpen(true)} />

        {/* Dynamic Page Container */}
        <main style={{ padding: '24px', flex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* Customer Quick Creation Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />
    </div>
  );
};
