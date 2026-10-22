import React, { useState, useEffect } from 'react';
import HeaderWithLogo from '../../components/HeaderWithLogo';
import Sidebar from '../../components/Sidebar';
import { serviceMenuService, ServiceItem } from '../../services/serviceMenuService';
import { authService } from '../../services/authService';
import { Plus, Search, Trash2, Edit2, Upload } from 'lucide-react';

interface ServicesPageProps {
    onLogout: () => void;
}

export default function ServicesPage({ onLogout }: ServicesPageProps) {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const currentUser = authService.getCurrentUser();
    const sidebarRole = currentUser?.role === 'admin' ? 'admin' : (currentUser?.role === 'billing' ? 'billing' : 'manager');

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [duration, setDuration] = useState('30 min');
    const [category, setCategory] = useState('Haircut');

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        const data = await serviceMenuService.getAllServices();
        setServices(data);
    }

    const handleSyncDefaultServices = async () => {
        if (!window.confirm("Sync all 200+ default Celebrity Cuts services into Firebase Firestore? Existing custom edits will be preserved.")) return;
        try {
            setIsSyncing(true);
            await serviceMenuService.seedDefaultServices();
            await loadServices();
            alert("Services menu synced successfully to Firebase!");
        } catch (e: any) {
            alert("Failed to sync services: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    }

    const handleOpenAdd = () => {
        setEditingId(null);
        setName('');
        setPrice('');
        setDuration('30 min');
        setCategory('Haircut');
        setShowModal(true);
    }

    const handleOpenEdit = (service: ServiceItem) => {
        setEditingId(service.id);
        setName(service.name);
        setPrice(service.price);
        setDuration(service.duration);
        setCategory(service.category);
        setShowModal(true);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || price === '') {
            alert("Name and Price are required");
            return;
        }

        try {
            if (editingId) {
                await serviceMenuService.updateService(editingId, {
                    name,
                    price: Number(price),
                    duration,
                    category
                });
            } else {
                await serviceMenuService.addService({
                    name,
                    price: Number(price),
                    duration,
                    category
                });
            }

            setShowModal(false);
            loadServices();
        } catch (error: any) {
            console.error("Error saving service:", error);
            alert("Error saving service: " + error.message);
        }
    }

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this service?")) {
            await serviceMenuService.deleteService(id);
            loadServices();
        }
    }

    const filteredServices = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              s.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === '' || s.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const uniqueCategories = Array.from(new Set(services.map(s => s.category))).sort();

    return (
        <div className="app-container">
            <Sidebar userType={sidebarRole} />
            <div className="main-content">
                <HeaderWithLogo title="SERVICES MENU" onLogout={onLogout} />

                <div className="content-area">
                    <div className="card no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                            <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px 10px 10px 40px',
                                        background: '#111', border: '1px solid #333',
                                        borderRadius: '8px', color: '#fff'
                                    }}
                                />
                            </div>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                style={{
                                    padding: '10px',
                                    background: '#111',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    appearance: 'auto',
                                    minWidth: '150px'
                                }}
                            >
                                <option value="">All Categories</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                                onClick={handleSyncDefaultServices}
                                disabled={isSyncing}
                                className="button"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#222',
                                    border: '1px solid #444',
                                    color: '#fff',
                                    cursor: isSyncing ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <Upload size={18} /> {isSyncing ? 'Syncing...' : 'Sync Full Menu to Firebase'}
                            </button>
                            <button
                                onClick={handleOpenAdd}
                                className="button button-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Plus size={18} /> Add Service
                            </button>
                        </div>
                    </div>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#111', borderBottom: '1px solid #333' }}>
                                    <th style={{ padding: '15px', color: '#888', fontWeight: 600 }}>Service Name</th>
                                    <th style={{ padding: '15px', color: '#888', fontWeight: 600 }}>Category</th>
                                    <th style={{ padding: '15px', color: '#888', fontWeight: 600 }}>Price</th>
                                    <th style={{ padding: '15px', color: '#888', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.length > 0 ? filteredServices.map((service) => (
                                    <tr key={service.id} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '15px', color: '#fff', fontWeight: 500 }}>
                                            {service.name}
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ background: '#222', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#ccc' }}>
                                                {service.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                                            ₹{service.price}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button
                                                    onClick={() => handleOpenEdit(service)}
                                                    style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '5px' }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#666' }}>
                                            No services found. Add some services to your menu.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '450px', border: '1px solid #333', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'var(--accent-gold)' }}>
                                {editingId ? 'Edit Service' : 'Add New Service'}
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#aaa' }}>Service Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Premium Hair Cut"
                                    required
                                    style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#aaa' }}>Price (₹)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={price}
                                        onChange={e => setPrice(Number(e.target.value) || '')}
                                        placeholder="e.g. 500"
                                        required
                                        style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#aaa' }}>Duration</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={duration}
                                        onChange={e => setDuration(e.target.value)}
                                        placeholder="e.g. 30 min"
                                        style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: '#aaa' }}>Category</label>
                                <select
                                    className="input-field"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#fff', appearance: 'auto' }}
                                >
                                    <option value="Haircut">Haircut</option>
                                    <option value="Treatment">Treatment</option>
                                    <option value="Coloring">Coloring</option>
                                    <option value="Beard">Beard</option>
                                    <option value="Facial">Facial</option>
                                    <option value="Massage">Massage</option>
                                    <option value="Grooming">Grooming</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="button button-secondary" style={{ flex: 1 }}>Cancel</button>
                                <button type="submit" className="button button-primary" style={{ flex: 1 }}>{editingId ? 'Update Service' : 'Add Service'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
