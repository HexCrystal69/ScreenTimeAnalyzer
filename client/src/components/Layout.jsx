import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrowserTracker from './BrowserTracker';
import CareerOnboardingModal from './CareerOnboardingModal';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/trends', label: 'Trends', icon: '📈' },
    { path: '/app-usage', label: 'App Usage', icon: '📱' },
    { path: '/categories', label: 'Categories', icon: '🏷️' },
    { path: '/distracting-apps', label: 'Distracting Apps', icon: '🚫' },
    { path: '/tasks', label: 'My Tasks', icon: '✅' },
    { path: '/alerts', label: 'Alerts', icon: '🔔' },
    { path: '/opportunity', label: 'Opportunity Cost', icon: '💰' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
    { path: '/reports', label: 'Export Report', icon: '📄' },
];

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const currentPage = navItems.find(n => n.path === location.pathname);

    return (
        <div className="app-layout">
            <BrowserTracker />
            <CareerOnboardingModal />
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <span className="brand-icon">⏱️</span>
                    <h1>AttenTrack</h1>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <NavLink key={item.path} to={item.path} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
                        <div className="user-details">
                            <span className="user-name">{user?.name || 'User'}</span>
                            <span className="user-email">{user?.email || ''}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="topbar">
                    <div className="breadcrumb">
                        <span className="breadcrumb-icon">{currentPage?.icon || '📊'}</span>
                        <h2>{currentPage?.label || 'Dashboard'}</h2>
                    </div>
                    <div className="topbar-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/reports')}>📄 Generate Report</button>
                    </div>
                </header>
                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
