import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, ShoppingBag, Eye, Trash } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  business_name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  unit_price: number;
}

interface Challan {
  id: string;
  challan_number: string;
  customer_name: string;
  customer_business: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  total_quantity: number;
  created_by_user: string;
  created_at: string;
  product_snapshot: Array<{
    product_id: string;
    name: string;
    sku: string;
    category: string;
    unit_price: number;
    quantity: number;
  }>;
}

export const SalesChallan: React.FC = () => {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanItems, setChallanItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
  const [createStatus, setCreateStatus] = useState<'Draft' | 'Confirmed'>('Draft');
  const [createError, setCreateError] = useState('');

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        limit: '100',
      });
      const data = await apiFetch(`/challans?${queryParams.toString()}`);
      setChallans(data.challans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const loadCreateData = async () => {
    try {
      const custData = await apiFetch('/customers?limit=100');
      const prodData = await apiFetch('/products?limit=100');
      setCustomers(custData.customers);
      setProducts(prodData.products);
      
      setSelectedCustomerId('');
      setChallanItems([]);
      setCreateError('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    loadCreateData();
    setIsCreateOpen(true);
  };

  const handleAddItem = () => {
    setChallanItems([...challanItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const list = [...challanItems];
    list.splice(index, 1);
    setChallanItems(list);
  };

  const handleItemChange = (index: number, field: 'product_id' | 'quantity', value: any) => {
    const list = [...challanItems];
    if (field === 'quantity') {
      list[index][field] = parseInt(value) || 1;
    } else {
      list[index][field] = value;
    }
    setChallanItems(list);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!selectedCustomerId) {
      setCreateError('Please select a customer.');
      return;
    }

    if (challanItems.length === 0) {
      setCreateError('Please add at least one product item.');
      return;
    }

    // Validate details
    for (const item of challanItems) {
      if (!item.product_id) {
        setCreateError('Please select a product for all lines.');
        return;
      }
      if (item.quantity <= 0) {
        setCreateError('Quantity must be greater than zero.');
        return;
      }
    }

    try {
      await apiFetch('/challans', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          products: challanItems,
          status: createStatus,
        }),
      });
      setIsCreateOpen(false);
      fetchChallans();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create challan.');
    }
  };

  const handleConfirmChallan = async (challanId: string) => {
    if (!window.confirm('Confirming this challan will deduct products from current stock. Proceed?')) return;
    try {
      await apiFetch(`/challans/${challanId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Confirmed' }),
      });
      fetchChallans();
      if (selectedChallan && selectedChallan.id === challanId) {
        // Refresh details modal
        const refreshed = await apiFetch(`/challans/${challanId}`);
        setSelectedChallan(refreshed);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to confirm challan.');
    }
  };

  const handleCancelChallan = async (challanId: string) => {
    if (!window.confirm('Are you sure you want to cancel this draft challan?')) return;
    try {
      await apiFetch(`/challans/${challanId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Cancelled' }),
      });
      fetchChallans();
      if (selectedChallan && selectedChallan.id === challanId) {
        // Refresh details modal
        const refreshed = await apiFetch(`/challans/${challanId}`);
        setSelectedChallan(refreshed);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel challan.');
    }
  };

  const canModify = user?.role === 'Admin' || user?.role === 'Sales';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Sales Challans</h2>
          <p style={{ color: 'var(--text-muted)' }}>Generate delivery challans, review order snapshots, and confirm shipments.</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <ShoppingBag size={18} /> New Challan
          </button>
        )}
      </div>

      {/* Toolbar Filters */}
      <div className="premium-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by challan number or customer..."
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="input-field" style={{ width: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Challan List */}
      <div className="premium-card" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer / Business</th>
                <th>Status</th>
                <th>Total Quantity</th>
                <th>Logged By</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading challans...</td>
                </tr>
              ) : challans.length > 0 ? (
                challans.map((ch) => (
                  <tr key={ch.id}>
                    <td><strong>{ch.challan_number}</strong></td>
                    <td>
                      <div>{ch.customer_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ch.customer_business}</div>
                    </td>
                    <td>
                      <span className={`badge ${ch.status === 'Confirmed' ? 'badge-success' : ch.status === 'Draft' ? 'badge-warning' : 'badge-danger'}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td>{ch.total_quantity} units</td>
                    <td>{ch.created_by_user}</td>
                    <td>{new Date(ch.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedChallan(ch)}>
                          <Eye size={14} /> View Details
                        </button>
                        {ch.status === 'Draft' && (canModify || user?.role === 'Warehouse') && (
                          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--primary)', color: '#ffffff' }} onClick={() => handleConfirmChallan(ch.id)}>
                            Confirm
                          </button>
                        )}
                        {ch.status === 'Draft' && canModify && (
                          <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--pastel-red-text)', background: 'var(--pastel-red)' }} onClick={() => handleCancelChallan(ch.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No challans found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Challan View Details Modal */}
      {selectedChallan && (
        <div className="modal-overlay" onClick={() => setSelectedChallan(null)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delivery Challan Details: {selectedChallan.challan_number}</h3>
              <button className="modal-close" onClick={() => setSelectedChallan(null)}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', fontSize: '14px' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Customer / Dispatch Address</p>
                <strong>{selectedChallan.customer_name}</strong><br />
                {selectedChallan.customer_business}<br />
                {/* Fallback to snapshot info or direct detail */}
                {(selectedChallan as any).customer_address && (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {(selectedChallan as any).customer_address}
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Challan Info</p>
                <strong>Status:</strong> <span className={`badge ${selectedChallan.status === 'Confirmed' ? 'badge-success' : selectedChallan.status === 'Draft' ? 'badge-warning' : 'badge-danger'}`}>{selectedChallan.status}</span><br />
                <strong>Created on:</strong> {new Date(selectedChallan.created_at).toLocaleString()}<br />
                <strong>Created by:</strong> {selectedChallan.created_by_user}
              </div>
            </div>

            {/* Product Snapshot View */}
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '15px', marginBottom: '12px', color: 'var(--text-muted)' }}>Order Snapshot (Product details preserved at generation)</h4>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Product / SKU</th>
                      <th>Category</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedChallan.product_snapshot.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.name}</strong><br />
                          <code style={{ fontSize: '11px' }}>{item.sku}</code>
                        </td>
                        <td>{item.category}</td>
                        <td>₹{parseFloat(item.unit_price as any).toFixed(2)}</td>
                        <td>{item.quantity} units</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          ₹{(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#1e293b', fontWeight: 700 }}>
                      <td colSpan={3} style={{ textAlign: 'right' }}>Total Sum:</td>
                      <td>{selectedChallan.total_quantity} units</td>
                      <td style={{ textAlign: 'right', color: '#60a5fa' }}>
                        ₹{selectedChallan.product_snapshot.reduce((acc, curr) => acc + (curr.unit_price * curr.quantity), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:5000/api/challans/${selectedChallan.id}/pdf`, {
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    if (!response.ok) throw new Error('Failed to generate PDF');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedChallan.challan_number}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  } catch (err: any) {
                    alert(err.message || 'Error exporting PDF');
                  }
                }}
              >
                Export Invoice PDF
              </button>

              {selectedChallan.status === 'Draft' && (
                <>
                  {canModify && (
                    <button className="btn btn-danger" onClick={() => handleCancelChallan(selectedChallan.id)}>
                      Cancel Challan
                    </button>
                  )}
                  {(canModify || user?.role === 'Warehouse') && (
                    <button className="btn btn-primary" style={{ background: 'var(--primary)', color: '#ffffff' }} onClick={() => handleConfirmChallan(selectedChallan.id)}>
                      Confirm & Dispatch Stock
                    </button>
                  )}
                </>
              )}

              {selectedChallan.status === 'Confirmed' && canModify && (
                <button className="btn btn-danger" onClick={() => handleCancelChallan(selectedChallan.id)}>
                  Cancel & Restore Stock
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Challan Modal */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Sales Challan</h3>
              <button className="modal-close" onClick={() => setIsCreateOpen(false)}>&times;</button>
            </div>

            {createError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Select Customer *</label>
                <select className="input-field" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
                  <option value="">-- Choose Client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.business_name})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px' }}>Product Items Line</h4>
                  <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleAddItem}>
                    + Add Product Line
                  </button>
                </div>

                {challanItems.map((item, index) => {
                  const currentSelectedProduct = products.find(p => p.id === item.product_id);
                  return (
                    <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' }}>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product</label>
                        <select className="input-field" value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} required>
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (SKU: {p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: '120px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Available Stock</label>
                        <input type="text" className="input-field" style={{ background: '#f5f5f5', color: '#333' }} value={currentSelectedProduct ? `${currentSelectedProduct.current_stock} units` : '-'} disabled />
                      </div>

                      <div style={{ width: '120px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quantity</label>
                        <input type="number" className="input-field" min={1} value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} required />
                      </div>

                      <button type="button" className="btn btn-danger" style={{ padding: '12px' }} onClick={() => handleRemoveItem(index)}>
                        <Trash size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Save Status</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input type="radio" name="create_status" checked={createStatus === 'Draft'} onChange={() => setCreateStatus('Draft')} /> Save as Draft
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', cursor: 'pointer' }}>
                      <input type="radio" name="create_status" checked={createStatus === 'Confirmed'} onChange={() => setCreateStatus('Confirmed')} /> Confirm & Dispatch
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Generate Challan</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
