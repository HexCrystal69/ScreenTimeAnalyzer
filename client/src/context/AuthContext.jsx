import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('attentrack_token');
        const savedUser = localStorage.getItem('attentrack_user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            api.get('/auth/me').then(res => {
                setUser(res.data.user);
                localStorage.setItem('attentrack_user', JSON.stringify(res.data.user));
            }).catch(() => {
                localStorage.removeItem('attentrack_token');
                localStorage.removeItem('attentrack_user');
                setUser(null);
            });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('attentrack_token', res.data.token);
        localStorage.setItem('attentrack_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('attentrack_token', res.data.token);
        localStorage.setItem('attentrack_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('attentrack_token');
        localStorage.removeItem('attentrack_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
