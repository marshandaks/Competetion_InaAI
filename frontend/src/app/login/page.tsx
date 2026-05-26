'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, BarChart2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Email atau password salah');
      const data = await res.json();
      localStorage.setItem('sentiview_token', data.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #059669, #10B981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14, boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
          }}>
            <BarChart2 size={22} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.4px' }}>
            SentiView AI
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
            Sign in to your admin dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            color: '#DC2626', borderRadius: 8, padding: '10px 14px',
            fontSize: 13, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Lock size={13} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label className="login-label">Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Mail size={15} color="#9CA3AF" />
              </div>
              <input
                type="email"
                required
                className="login-input"
                style={{ paddingLeft: 36 }}
                placeholder="admin@sentiview.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label className="login-label">Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Lock size={15} color="#9CA3AF" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="login-input"
                style={{ paddingLeft: 36, paddingRight: 42 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px 16px',
              background: loading ? '#6EE7B7' : 'linear-gradient(135deg, #059669, #10B981)',
              color: '#fff', border: 'none', borderRadius: 9,
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(16,185,129,0.3)',
              transition: 'all 0.15s',
            }}
          >
            {loading ? (
              <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
            ) : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#9CA3AF' }}>
          Default: admin@sentiview.com · admin123
        </p>
      </div>
    </div>
  );
}
