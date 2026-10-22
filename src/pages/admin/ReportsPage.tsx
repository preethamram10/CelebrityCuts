
import Sidebar from '../../components/Sidebar';
import HeaderWithLogo from '../../components/HeaderWithLogo';

interface ReportsPageProps {
    onLogout: () => void
}
export default function ReportsPage({ onLogout }: ReportsPageProps) {
    return (
        <div className="app-container">
            <Sidebar userType="admin" />
            <div className="main-content">
                <HeaderWithLogo title="Reports & Analytics" onLogout={onLogout} />
                <div className="content-area">
                    <div className="card">
                        <div className="card-title">Reports Dashboard</div>
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                            <h3>Detailed Analytics Coming Soon</h3>
                            <p>We are working on comprehensive reports for Revenue, Staff Performance, and Customer Retention.</p>
                        </div>
                    </div>
                    <div className="dashboard-grid" style={{ marginTop: '20px' }}>
                        <div className="card">
                            <div className="card-title">Export Options</div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button className="button button-primary">Export CSV</button>
                                <button className="button button-secondary">Export PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}