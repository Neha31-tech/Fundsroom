import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { UsersRound, Boxes, ShieldAlert, FileCheck, TrendingUp, History } from 'lucide-react';

interface DashboardStats {
  customers: number;
  products: number;
  lowStock: number;
  confirmedChallans: number;
  totalSalesQuantity: number;
  recentMovements: Array<{
    id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    movement_type: 'IN' | 'OUT';
    reason: string;
    user_name: string;
    created_at: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/dashboard/stats');
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading dashboard statistics...</div>;
  if (error) return <div style={{ padding: '24px', color: 'var(--danger)' }}>{error}</div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Operational Dashboard</h2>
        <p style={{ color: 'var(--text-muted)' }}>Overview of warehouse, CRM logs, and sales metrics.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-card customers">
          <div className="dashboard-card-icon" style={{ background: 'rgba(124, 58, 237, 0.12)', color: 'var(--pastel-indigo-text)' }}>
            <UsersRound size={26} />
          </div>
          <div>
            <div className="dashboard-card-label">Total Customers</div>
            <div className="dashboard-card-value">{stats?.customers}</div>
          </div>
        </div>

        <div className="dashboard-card catalog">
          <div className="dashboard-card-icon" style={{ background: 'rgba(13, 148, 136, 0.12)', color: 'var(--pastel-green-text)' }}>
            <Boxes size={26} />
          </div>
          <div>
            <div className="dashboard-card-label">Catalog Items</div>
            <div className="dashboard-card-value">{stats?.products}</div>
          </div>
        </div>

        <div className="dashboard-card low-stock">
          <div className="dashboard-card-icon" style={{ background: 'rgba(225, 29, 72, 0.12)', color: 'var(--pastel-red-text)' }}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <div className="dashboard-card-label">Low Stock Alert</div>
            <div className="dashboard-card-value" style={{ color: stats?.lowStock && stats.lowStock > 0 ? 'var(--pastel-red-text)' : 'inherit' }}>
              {stats?.lowStock}
            </div>
          </div>
        </div>

        <div className="dashboard-card challans">
          <div className="dashboard-card-icon" style={{ background: 'rgba(217, 119, 6, 0.12)', color: 'var(--pastel-amber-text)' }}>
            <FileCheck size={26} />
          </div>
          <div>
            <div className="dashboard-card-label">Confirmed Challans</div>
            <div className="dashboard-card-value">{stats?.confirmedChallans}</div>
          </div>
        </div>

        <div className="dashboard-card sales">
          <div className="dashboard-card-icon" style={{ background: 'rgba(3, 105, 180, 0.12)', color: 'var(--pastel-blue-text)' }}>
            <TrendingUp size={26} />
          </div>
          <div>
            <div className="dashboard-card-label">Units Sold</div>
            <div className="dashboard-card-value">{stats?.totalSalesQuantity}</div>
          </div>
        </div>
      </div>

      {/* Stock movements and recent actions */}
      <div className="premium-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <History size={20} className="text-muted" />
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Recent Stock Movement Log</h3>
        </div>

        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Direction</th>
                <th>Reason</th>
                <th>Logged By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentMovements && stats.recentMovements.length > 0 ? (
                stats.recentMovements.map((move) => (
                  <tr key={move.id}>
                    <td style={{ fontWeight: 500 }}>{move.product_name}</td>
                    <td><code>{move.product_sku}</code></td>
                    <td>{move.quantity}</td>
                    <td>
                      <span className={`badge ${move.movement_type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                        {move.movement_type}
                      </span>
                    </td>
                    <td>{move.reason}</td>
                    <td>{move.user_name || 'System'}</td>
                    <td>{new Date(move.created_at).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent stock movements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
