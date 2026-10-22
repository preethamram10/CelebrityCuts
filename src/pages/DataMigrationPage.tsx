import React, { useState } from 'react';
import HeaderWithLogo from '../components/HeaderWithLogo';
import Sidebar from '../components/Sidebar';
import { seedService } from '../services/seedService';
import { authService } from '../services/authService';
import { Database, CheckCircle2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface DataMigrationPageProps {
    onLogout: () => void;
}

export default function DataMigrationPage({ onLogout }: DataMigrationPageProps) {
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const currentUser = authService.getCurrentUser();
    const sidebarRole = currentUser?.role === 'admin' ? 'admin' : (currentUser?.role === 'billing' ? 'billing' : 'manager');

    const handleRunMigration = async () => {
        setRunning(true);
        setError(null);
        setLogs([]);
        setResult(null);

        try {
            const res = await seedService.seedAll((msg) => {
                setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
            });
            setResult(res.summary);
        } catch (err: any) {
            setError(err.message || 'Migration encountered an error');
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="app-container">
            <Sidebar userType={sidebarRole} />
            <div className="main-content">
                <HeaderWithLogo title="DATABASE MIGRATION & SEEDING" onLogout={onLogout} />

                <div className="content-area" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
                    <div className="card" style={{ padding: '28px', background: '#111', borderRadius: '12px', border: '1px solid #282828' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                            <div style={{ background: '#e6b80020', padding: '12px', borderRadius: '10px', color: '#e6b800' }}>
                                <Database size={28} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>Firestore Collections Initializer</h2>
                                <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '13px' }}>
                                    Transmit and seed all salon master data directly into your Firebase project (<code>cccuts-eccaa</code>).
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', margin: '20px 0' }}>
                            <div style={{ background: '#181818', padding: '16px', borderRadius: '8px', border: '1px solid #2c2c2c' }}>
                                <div style={{ color: '#888', fontSize: '12px', fontWeight: 600 }}>SERVICES MENU</div>
                                <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700, marginTop: '4px' }}>220+ Items</div>
                                <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>Haircut, Colors, Spa, Botox</div>
                            </div>
                            <div style={{ background: '#181818', padding: '16px', borderRadius: '8px', border: '1px solid #2c2c2c' }}>
                                <div style={{ color: '#888', fontSize: '12px', fontWeight: 600 }}>STAFF ROSTER</div>
                                <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700, marginTop: '4px' }}>9 Stylists</div>
                                <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>Across all 3 branches</div>
                            </div>
                            <div style={{ background: '#181818', padding: '16px', borderRadius: '8px', border: '1px solid #2c2c2c' }}>
                                <div style={{ color: '#888', fontSize: '12px', fontWeight: 600 }}>HAIR EXTENSIONS</div>
                                <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700, marginTop: '4px' }}>21 Varieties</div>
                                <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>With inventory & prices</div>
                            </div>
                            <div style={{ background: '#181818', padding: '16px', borderRadius: '8px', border: '1px solid #2c2c2c' }}>
                                <div style={{ color: '#888', fontSize: '12px', fontWeight: 600 }}>BRANCHES</div>
                                <div style={{ fontSize: '18px', color: '#fff', fontWeight: 700, marginTop: '4px' }}>3 Branches</div>
                                <div style={{ color: '#aaa', fontSize: '11px', marginTop: '2px' }}>Hyderabad, Vizag, VJW</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <button
                                onClick={handleRunMigration}
                                disabled={running}
                                className="button button-primary"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 24px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    cursor: running ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {running ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        Transmitting Data to Firestore...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Start Migration & Create Collections
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div style={{ marginTop: '20px', padding: '14px', background: '#3b1212', border: '1px solid #782222', borderRadius: '8px', color: '#ffb3b3', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        {result && (
                            <div style={{ marginTop: '20px', padding: '16px', background: '#0e2b14', border: '1px solid #1a5c2b', borderRadius: '8px', color: '#73e290' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
                                    <CheckCircle2 size={20} />
                                    All Master Collections Successfully Created & Populated in Firebase!
                                </div>
                                <ul style={{ marginTop: '10px', marginBottom: 0, paddingLeft: '20px', fontSize: '13px' }}>
                                    <li><code>services</code>: {result.services} salon catalog services</li>
                                    <li><code>staff</code>: {result.staff} stylists and specialists</li>
                                    <li><code>hair_extensions</code>: {result.hairExtensions} hair extension items</li>
                                    <li><code>branches</code>: {result.branches} active salon branches</li>
                                    <li><code>customers</code>: {result.customers} initial customer profiles</li>
                                </ul>
                            </div>
                        )}

                        {logs.length > 0 && (
                            <div style={{ marginTop: '24px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#aaa', marginBottom: '8px' }}>MIGRATION LOGS</div>
                                <div style={{
                                    background: '#0a0a0a',
                                    border: '1px solid #222',
                                    borderRadius: '8px',
                                    padding: '14px',
                                    fontFamily: 'monospace',
                                    fontSize: '12px',
                                    maxHeight: '220px',
                                    overflowY: 'auto',
                                    color: '#8bd450'
                                }}>
                                    {logs.map((log, i) => (
                                        <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
