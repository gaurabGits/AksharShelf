import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../useAdminAuth';
import { useNotification } from '../../context/Notification';
import { adminLogin } from '../adminAPI';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const { loginAdmin } = useAdminAuth();
  const navigate       = useNavigate();
  const notify         = useNotification(); // ← use global notification system

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!username.trim() || !password.trim()) {
      notify.warning('Missing Fields', 'Please enter your username and password');
      return;
    }

    setLoading(true);

    try {
      const { data } = await adminLogin({ username, password });

      // Success notification
      notify.success('Login Successful', 'Welcome back! Redirecting to dashboard...');

      loginAdmin(data);

      // Small delay so user sees the success toast
      setTimeout(() => navigate('/admin/dashboard'), 1200);

    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Try again.';

      // Error notification
      notify.error('Login Failed', message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Akshar Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-600">Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-[#1a1a2e] hover:bg-[#2a2a4e] disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer mt-1"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
