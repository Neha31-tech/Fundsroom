import React from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CustomerCRM } from './pages/CustomerCRM';
import { ProductsInventory } from './pages/ProductsInventory';
import { SalesChallan } from './pages/SalesChallan';
import { BadgeDollarSign, LayoutDashboard, LogOut, Package, ShieldCheck, ShoppingBag, ShoppingCart, UserCheck, Users } from 'lucide-react';

const roleIcons: Record<string, React.ReactElement> = {
  Admin: <ShieldCheck size={16} />,
  Sales: <ShoppingCart size={16} />,
  Warehouse: <Package size={16} />,
  Accounts: <BadgeDollarSign size={16} />,
};

interface AppLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ currentTab, setCurrentTab, children }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'crm', label: 'Customer CRM', icon: <Users size={18} /> },
    { id: 'inventory', label: 'Products & Inventory', icon: <Package size={18} /> },
    { id: 'challans', label: 'Sales Challans', icon: <ShoppingBag size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--pastel-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '20px',
            color: 'var(--pastel-green-text)'
          }}>NO</div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.025em', color: '#0f766e' }}>NexaOps</h1>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Operations Portal</span>
          </div>
        </div>

        {/* User Card */}
        <div style={{
          background: 'var(--bg-app)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px'
        }}>
          <div style={{ padding: '8px', background: 'var(--pastel-blue)', borderRadius: '8px', color: 'var(--pastel-blue-text)' }}>
            <UserCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{user?.username}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{user?.role && roleIcons[user.role]}</span>
              <span>Role: {user?.role}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                color: currentTab === item.id ? '#0f766e' : 'var(--text-muted)',
                backgroundColor: currentTab === item.id ? 'var(--pastel-green)' : 'transparent',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            color: 'var(--pastel-red-text)',
            backgroundColor: 'var(--pastel-red)',
            fontWeight: 600,
            fontSize: '14px',
            marginTop: 'auto',
            justifyContent: 'center'
          }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', maxHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = React.useState('dashboard');

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)' }}>
        Loading FundStrom Portal...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <AppLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard />}
      {currentTab === 'crm' && <CustomerCRM />}
      {currentTab === 'inventory' && <ProductsInventory />}
      {currentTab === 'challans' && <SalesChallan />}
    </AppLayout>
  );
};

export default App;
