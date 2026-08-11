import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Phone, MapPin, Eye, FileText } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number?: string;
  type: 'Retail' | 'Wholesale' | 'Distributor';
  address: string;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date?: string;
  notes?: string;
}

interface FollowUp {
  id: string;
  notes: string;
  created_by_user: string;
  created_at: string;
}

export const CustomerCRM: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Details modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [newFollowUpNote, setNewFollowUpNote] = useState('');

  // Create/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    mobile: '',
    email: '',
    business_name: '',
    gst_number: '',
    type: 'Retail' as Customer['type'],
    address: '',
    status: 'Lead' as Customer['status'],
    follow_up_date: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        type: typeFilter,
        status: statusFilter,
        limit: '100',
      });
      const data = await apiFetch(`/customers?${queryParams.toString()}`);
      setCustomers(data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, statusFilter]);

  const handleOpenDetail = async (customer: Customer) => {
    try {
      const data = await apiFetch(`/customers/${customer.id}`);
      setSelectedCustomer(data.customer);
      setFollowUps(data.followUps);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUpNote.trim() || !selectedCustomer) return;

    try {
      await apiFetch(`/customers/${selectedCustomer.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ notes: newFollowUpNote }),
      });
      setNewFollowUpNote('');
      // Reload details
      handleOpenDetail(selectedCustomer);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to add follow up notes.');
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: '',
      name: '',
      mobile: '',
      email: '',
      business_name: '',
      gst_number: '',
      type: 'Retail',
      address: '',
      status: 'Lead',
      follow_up_date: '',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setModalMode('edit');
    setFormData({
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      business_name: customer.business_name,
      gst_number: customer.gst_number || '',
      type: customer.type,
      address: customer.address,
      status: customer.status,
      follow_up_date: customer.follow_up_date ? customer.follow_up_date.split('T')[0] : '',
      notes: customer.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.mobile || !formData.email || !formData.business_name || !formData.address) {
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      if (modalMode === 'create') {
        await apiFetch('/customers', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      } else {
        await apiFetch(`/customers/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      }
      setIsModalOpen(false);
      fetchCustomers();
      if (selectedCustomer && selectedCustomer.id === formData.id) {
        // Refresh details if open
        const updated = await apiFetch(`/customers/${formData.id}`);
        setSelectedCustomer(updated.customer);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to save customer.');
    }
  };

  const canModify = user?.role === 'Admin' || user?.role === 'Sales';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Customer CRM</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage leads, clients, active status, and log follow-up notes.</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <UserPlus size={18} /> Add Customer
          </button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="premium-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, email, mobile or business name..."
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="input-field" style={{ width: '180px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="Retail">Retail</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Distributor">Distributor</option>
        </select>

        <select className="input-field" style={{ width: '180px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Lead">Lead</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Customer List */}
      <div className="premium-card" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Business Name</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Follow-up Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading customers...</td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.business_name}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{c.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.mobile}</div>
                    </td>
                    <td>{c.type}</td>
                    <td>
                      <span className={`badge ${c.status === 'Active' ? 'badge-success' : c.status === 'Lead' ? 'badge-warning' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString() : '-'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenDetail(c)}>
                          <Eye size={14} /> View
                        </button>
                        {canModify && (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenEdit(c)}>
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No customers found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details & Follow Up History Panel */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Customer Details: {selectedCustomer.name}</h3>
              <button className="modal-close" onClick={() => setSelectedCustomer(null)}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Business Details</p>
                <h4 style={{ fontSize: '18px', fontWeight: 600, margin: '4px 0 12px' }}>{selectedCustomer.business_name}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div><strong>GST Number:</strong> {selectedCustomer.gst_number || 'N/A'}</div>
                  <div><strong>Customer Type:</strong> {selectedCustomer.type}</div>
                  <div><strong>Status:</strong> <span className={`badge ${selectedCustomer.status === 'Active' ? 'badge-success' : selectedCustomer.status === 'Lead' ? 'badge-warning' : 'badge-danger'}`}>{selectedCustomer.status}</span></div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Contact Information</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} className="text-muted" /> {selectedCustomer.mobile}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{selectedCustomer.email}</div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}><MapPin size={14} className="text-muted" style={{ marginTop: '3px' }} /> {selectedCustomer.address}</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} /> Follow-up Log History
              </h4>

              {canModify && (
                <form onSubmit={handleAddFollowUp} style={{ marginBottom: '24px' }}>
                  <textarea
                    className="input-field"
                    placeholder="Type follow-up notes here (e.g., 'Called customer, requested pricing catalog for Smart Watch Series')..."
                    rows={3}
                    style={{ resize: 'vertical', marginBottom: '12px' }}
                    value={newFollowUpNote}
                    onChange={(e) => setNewFollowUpNote(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary">Add Note</button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {followUps.length > 0 ? (
                  followUps.map((f) => (
                    <div key={f.id} style={{ background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <span>Logged by: <strong>{f.created_by_user}</strong></span>
                        <span>{new Date(f.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '14px' }}>{f.notes}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No follow up notes logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === 'create' ? 'Add New Customer' : 'Edit Customer'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Business Name *</label>
                  <input type="text" className="input-field" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Mobile *</label>
                  <input type="text" className="input-field" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>GST Number (Optional)</label>
                  <input type="text" className="input-field" placeholder="e.g. 07AAAFI9923G1Z0" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Customer Type *</label>
                  <select className="input-field" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Customer['type'] })}>
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea className="input-field" rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Status *</label>
                  <select className="input-field" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Customer['status'] })}>
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Follow-up Date</label>
                  <input type="date" className="input-field" value={formData.follow_up_date} onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })} />
                </div>
              </div>

              {modalMode === 'create' && (
                <div className="form-group">
                  <label>Initial Follow-up / Notes</label>
                  <textarea className="input-field" rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
