import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location: string;
}

interface StockMovement {
  id: string;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  created_by_user: string;
  created_at: string;
}

export const ProductsInventory: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail / stock movement logs
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Stock adjust modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Create/Edit product modal
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodModalMode, setProdModalMode] = useState<'create' | 'edit'>('create');
  const [prodFormData, setProdFormData] = useState({
    id: '',
    name: '',
    sku: '',
    category: '',
    unit_price: 0,
    current_stock: 0, // only for create
    min_stock_alert: 10,
    location: '',
  });
  const [prodError, setProdError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        category: categoryFilter,
        limit: '100',
      });
      const data = await apiFetch(`/products?${queryParams.toString()}`);
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const handleOpenDetail = async (prod: Product) => {
    try {
      const data = await apiFetch(`/products/${prod.id}`);
      setSelectedProduct(data.product);
      setMovements(data.movements);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdjust = (prod: Product) => {
    setSelectedProduct(prod);
    setAdjustQty(1);
    setAdjustType('IN');
    setAdjustReason('');
    setAdjustError('');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    if (!selectedProduct) return;

    try {
      await apiFetch(`/products/${selectedProduct.id}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: adjustQty,
          movement_type: adjustType,
          reason: adjustReason,
        }),
      });
      setIsAdjustOpen(false);
      fetchProducts();
      // Reload logs if detail pane open
      handleOpenDetail(selectedProduct);
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to adjust stock level.');
    }
  };

  const handleOpenCreate = () => {
    setProdModalMode('create');
    setProdFormData({
      id: '',
      name: '',
      sku: '',
      category: '',
      unit_price: 0,
      current_stock: 0,
      min_stock_alert: 10,
      location: '',
    });
    setProdError('');
    setIsProdModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setProdModalMode('edit');
    setProdFormData({
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      unit_price: prod.unit_price,
      current_stock: prod.current_stock, // ignored in update
      min_stock_alert: prod.min_stock_alert,
      location: prod.location,
    });
    setProdError('');
    setIsProdModalOpen(true);
  };

  const handleProdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdError('');

    if (!prodFormData.name || !prodFormData.sku || !prodFormData.category || !prodFormData.location) {
      setProdError('Please fill in all fields.');
      return;
    }

    try {
      if (prodModalMode === 'create') {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(prodFormData),
        });
      } else {
        await apiFetch(`/products/${prodFormData.id}`, {
          method: 'PUT',
          body: JSON.stringify(prodFormData),
        });
      }
      setIsProdModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setProdError(err.message || 'Failed to save product.');
    }
  };

  const canModify = user?.role === 'Admin' || user?.role === 'Warehouse';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Products & Inventory</h2>
          <p style={{ color: 'var(--text-muted)' }}>Warehouse catalog items, tracking stock levels, and adjusting movements.</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={18} /> Add Product
          </button>
        )}
      </div>

      {/* Toolbar Filter */}
      <div className="premium-card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, category or SKU code..."
            style={{ paddingLeft: '40px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="input-field" style={{ width: '180px' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Audio">Audio</option>
          <option value="Wearables">Wearables</option>
          <option value="Accessories">Accessories</option>
        </select>
      </div>

      {/* Products table */}
      <div className="premium-card" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Alert Threshold</th>
                <th>Location / Warehouse</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading products...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const isLow = p.current_stock <= p.min_stock_alert;
                  return (
                    <tr key={p.id}>
                      <td><code>{p.sku}</code></td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.category}</td>
                      <td>₹{parseFloat(p.unit_price as any).toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: isLow ? 'var(--pastel-red-text)' : 'var(--pastel-green-text)' }}>{p.current_stock}</span>
                          {isLow ? <span className="badge badge-danger">Low</span> : <span className="badge badge-success">In Stock</span>}
                        </div>
                      </td>
                      <td>{p.min_stock_alert} units</td>
                      <td>{p.location}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenDetail(p)}>
                            Logs
                          </button>
                          {canModify && (
                            <>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenAdjust(p)}>
                                Adjust
                              </button>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenEdit(p)}>
                                Edit
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No products in stock matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Log Modal */}
      {selectedProduct && !isAdjustOpen && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stock movements: {selectedProduct.name}</h3>
              <button className="modal-close" onClick={() => setSelectedProduct(null)}>&times;</button>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px' }}>
              <strong>SKU:</strong> <code>{selectedProduct.sku}</code> | <strong>Current Stock:</strong>{' '}
              <span style={{ color: selectedProduct.current_stock <= selectedProduct.min_stock_alert ? 'var(--pastel-red-text)' : 'var(--pastel-green-text)', fontWeight: 700 }}>
                {selectedProduct.current_stock} units
              </span>
            </div>

            <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>Logged By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length > 0 ? (
                    movements.map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.created_at).toLocaleString()}</td>
                        <td>
                          <span className={`badge ${m.movement_type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td>{m.quantity}</td>
                        <td>{m.reason}</td>
                        <td>{m.created_by_user || 'System'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No movements logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {isAdjustOpen && selectedProduct && (
        <div className="modal-overlay" onClick={() => setIsAdjustOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adjust Stock level</h3>
              <button className="modal-close" onClick={() => setIsAdjustOpen(false)}>&times;</button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px' }}>
              Product: <strong>{selectedProduct.name}</strong><br />
              SKU: <code>{selectedProduct.sku}</code> | Current Stock: <strong>{selectedProduct.current_stock}</strong>
            </div>

            {adjustError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit}>
              <div className="form-group">
                <label>Adjustment Type *</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input type="radio" name="adj_type" checked={adjustType === 'IN'} onChange={() => setAdjustType('IN')} /> Add Stock (IN)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input type="radio" name="adj_type" checked={adjustType === 'OUT'} onChange={() => setAdjustType('OUT')} /> Remove Stock (OUT)
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" className="input-field" min={1} value={adjustQty} onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)} required />
              </div>

              <div className="form-group">
                <label>Reason / Narration *</label>
                <input type="text" className="input-field" placeholder="e.g. Purchase invoice recd, damaged stock etc." value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProdModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProdModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{prodModalMode === 'create' ? 'Add New Catalog Product' : 'Edit Catalog Product'}</h3>
              <button className="modal-close" onClick={() => setIsProdModalOpen(false)}>&times;</button>
            </div>

            {prodError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {prodError}
              </div>
            )}

            <form onSubmit={handleProdSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" className="input-field" value={prodFormData.name} onChange={(e) => setProdFormData({ ...prodFormData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>SKU / Barcode *</label>
                  <input type="text" className="input-field" placeholder="e.g. SPK-PUL-003" value={prodFormData.sku} onChange={(e) => setProdFormData({ ...prodFormData, sku: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Category *</label>
                  <select className="input-field" value={prodFormData.category} onChange={(e) => setProdFormData({ ...prodFormData, category: e.target.value })}>
                    <option value="">Select Category</option>
                    <option value="Audio">Audio</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Price (INR) *</label>
                  <input type="number" step="0.01" className="input-field" value={prodFormData.unit_price} onChange={(e) => setProdFormData({ ...prodFormData, unit_price: parseFloat(e.target.value) || 0 })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {prodModalMode === 'create' && (
                  <div className="form-group">
                    <label>Initial Stock Qty *</label>
                    <input type="number" className="input-field" min={0} value={prodFormData.current_stock} onChange={(e) => setProdFormData({ ...prodFormData, current_stock: parseInt(e.target.value) || 0 })} required />
                  </div>
                )}
                <div className="form-group">
                  <label>Min Stock Alert Level *</label>
                  <input type="number" className="input-field" min={1} value={prodFormData.min_stock_alert} onChange={(e) => setProdFormData({ ...prodFormData, min_stock_alert: parseInt(e.target.value) || 10 })} required />
                </div>
              </div>

              <div className="form-group">
                <label>Warehouse Placement / Location *</label>
                <input type="text" className="input-field" placeholder="e.g. Warehouse A - Bin 12" value={prodFormData.location} onChange={(e) => setProdFormData({ ...prodFormData, location: e.target.value })} required />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProdModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
