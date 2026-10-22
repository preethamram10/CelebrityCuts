import React, { useEffect, useState } from 'react';


interface Session {
    id: string;
    username: string;
    role: string;
    device_info: string;
    login_time: string;
    last_active: string;
    ip_address: string;
    user_id: string; // Add this
}

const ActiveSessions: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();

        // Auto-refresh every 30s
        const interval = setInterval(fetchSessions, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchSessions = async () => {
        try {
            // Mock empty sessions for now since Supabase is removed
            setSessions([]);
        } catch (err) {
            console.error("Error fetching sessions:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString();
    };

    if (loading) return <div style={{ color: '#fff', padding: '20px' }}>Loading active sessions...</div>;

    return (
        <div style={{
            background: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            marginTop: '30px',
            maxWidth: '100%',
            overflowX: 'auto'
        }}>
            <h3 style={{ color: '#D4AF37', marginTop: 0, marginBottom: '15px', fontFamily: 'Playfair Display, serif' }}>
                Recent Logins & Active Sessions
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc', fontSize: '13px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>User</th>
                        <th style={{ padding: '10px' }}>Role</th>
                        <th style={{ padding: '10px' }}>Login Time</th>
                        <th style={{ padding: '10px' }}>Last Active</th>
                        <th style={{ padding: '10px' }}>Device Info</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sessions.map(session => (
                        <tr key={session.id} style={{ borderBottom: '1px solid #222' }}>
                            <td style={{ padding: '10px', color: '#fff', fontWeight: 500 }}>{session.username}</td>
                            <td style={{ padding: '10px' }}>
                                <span style={{
                                    background: session.role === 'admin' ? '#D4AF37' : '#333',
                                    color: session.role === 'admin' ? '#000' : '#fff',
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase'
                                }}>
                                    {session.role}
                                </span>
                            </td>
                            <td style={{ padding: '10px' }}>{formatTime(session.login_time)}</td>
                            <td style={{ padding: '10px' }}>{formatTime(session.last_active)}</td>
                            <td style={{ padding: '10px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#666' }}>
                                {session.device_info}
                            </td>
                            <td style={{ padding: '10px' }}>
                                <button
                                    onClick={async () => {
                                        if (window.confirm(`Logout ${session.username}?`)) {
                                            alert("User logged out (simulation for offline mode)!");
                                            fetchSessions();
                                        }
                                    }}
                                    style={{
                                        background: '#ff4444',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                >
                                    Logout End
                                </button>
                            </td>
                        </tr>
                    ))}
                    {sessions.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No active sessions found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ActiveSessions;
