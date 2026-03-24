import { useEffect, useState } from 'react';
import AdminNavbar from '../Components/adminNavbar';
import { deleteUser, fetchAllUsers, toggleBlockUser } from '../adminAPI';
import { useNotification } from '../../context/Notification';

const AdminUser = () => {
  const notify = useNotification();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    try {
      const { data } = await fetchAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load users';
      setError(message);
      notify.error('Load Error', message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadUsers(); }, []);

  const handleToggleBlock = async (userId) => {
    setBusyId(userId);
    setError('');
    try {
      const { data } = await toggleBlockUser(userId);
      const blocked = Boolean(data?.isBlocked);
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isBlocked: blocked } : u))
      );
      notify.success(
        blocked ? 'User Blocked' : 'User Unblocked',
        data?.message || (blocked ? 'User access has been blocked.' : 'User access has been restored.')
      );
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update user';
      setError(message);
      notify.error('Update Error', message);
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    setBusyId(userId);
    setError('');
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      notify.success('User Deleted', 'User was removed successfully.');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete user';
      setError(message);
      notify.error('Delete Error', message);
    } finally {
      setBusyId('');
    }
  };

  // Filter users by search
  const filtered = users.filter((u) =>
    (u.name  || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // Quick stats
  const totalUsers   = users.length;
  const activeUsers  = users.filter((u) => !u.isBlocked).length;
  const blockedUsers = users.filter((u) =>  u.isBlocked).length;

  // Avatar initials helper
  const getInitials = (name = '') =>
    name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="h-screen bg-[#f5f6fa] flex overflow-hidden">
      <AdminNavbar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-scroll pt-20 md:pt-10">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">👥 User Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage all registered users on Akshar Shelf
            </p>
          </div>

          {/* Stat Cards  */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">👤</div>
              <div>
                <p className="text-2xl font-bold text-[#1a1a2e]">{loading ? '--' : totalUsers}</p>
                <p className="text-xs text-slate-400">Total Users</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg">✅</div>
              <div>
                <p className="text-2xl font-bold text-green-600">{loading ? '--' : activeUsers}</p>
                <p className="text-xs text-slate-400">Active Users</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg">🚫</div>
              <div>
                <p className="text-2xl font-bold text-red-500">{loading ? '--' : blockedUsers}</p>
                <p className="text-xs text-slate-400">Blocked Users</p>
              </div>
            </div>
          </div>

          {/* Error Banner  */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          {/* Table Card  */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Table Header + Search */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#1a1a2e]">All Users</h2>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a1a2e] transition-colors w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>

                  {/* Loading Skeleton */}
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="px-5 py-4" colSpan={5}>
                          <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                        </td>
                      </tr>
                    ))

                  /* Empty State */
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                        <p className="text-3xl mb-2">🔍</p>
                        {search ? `No users matching "${search}"` : 'No users found.'}
                      </td>
                    </tr>

                  /* User Rows */
                  ) : (
                    filtered.map((user) => (
                      <tr
                        key={user._id}
                        className="border-t border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        {/* Avatar + Name */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1a1a2e] text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {getInitials(user.name)}
                            </div>
                            <span className="font-medium text-[#1a1a2e]">
                              {user.name || '—'}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3 text-slate-500">{user.email || '—'}</td>

                        {/* Role Badge */}
                        <td className="px-5 py-3">
                          <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full capitalize">
                            {user.role || 'user'}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-5 py-3">
                          {user.isBlocked ? (
                            <span className="inline-flex items-center gap-1 bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-2.5 py-1 rounded-full">
                              🚫 Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-50 border border-green-100 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full">
                              ✅ Active
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleBlock(user._id)}
                              disabled={busyId === user._id}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50
                                ${user.isBlocked
                                  ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                                  : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                }`}
                            >
                              {busyId === user._id ? '...' : user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(user._id)}
                              disabled={busyId === user._id}
                              className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {busyId === user._id ? '...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {!loading && filtered.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                Showing {filtered.length} of {totalUsers} user{totalUsers !== 1 ? 's' : ''}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUser;
