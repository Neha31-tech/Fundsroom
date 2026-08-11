import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BadgeDollarSign, LogIn, Package, ShieldCheck, ShoppingCart } from 'lucide-react';

const roleIcons: Record<string, React.ReactElement> = {
  Admin: <ShieldCheck size={16} />,
  Sales: <ShoppingCart size={16} />,
  Warehouse: <Package size={16} />,
  Accounts: <BadgeDollarSign size={16} />,
};

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const rolesList = [
    { id: 'Admin', label: 'Admin', user: 'admin', pass: 'Admin' },
    { id: 'Sales', label: 'Sales', user: 'sales', pass: 'Sales' },
    { id: 'Warehouse', label: 'Warehouse', user: 'warehouse', pass: 'Warehouse' },
    { id: 'Accounts', label: 'Accounts', user: 'accounts', pass: 'Accounts' },
  ];

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 100%)',
      padding: '20px'
    }}>
      <div className="premium-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', background: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '8px', color: 'var(--primary)' }}>NexaOps</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>ERP & CRM Operations Portal</p>
        </div>

        {/* Quick Role Selection Cards */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            Choose Operational Role
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {rolesList.map((r) => {
              const isActive = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: isActive ? '#0ea5e9' : 'var(--border-color)',
                    background: isActive ? '#f0fdfa' : '#ffffff',
                    color: isActive ? '#0f766e' : 'var(--text-main)',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? '0 4px 12px rgba(14, 165, 233, 0.08)' : 'none'
                  }}
                >
                  <div style={{ color: isActive ? '#0ea5e9' : 'var(--text-muted)' }}>
                    {roleIcons[r.id]}
                  </div>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="input-field"
              placeholder="e.g. admin, sales"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSelectedRole(''); // Deselect active button if typed manually
              }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setSelectedRole(''); // Deselect active button if typed manually
              }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            <LogIn size={18} />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
