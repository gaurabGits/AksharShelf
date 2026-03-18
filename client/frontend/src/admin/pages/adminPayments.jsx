import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../Components/adminNavbar";
import { fetchPaymentOrders, fetchPurchases } from "../adminAPI";
import { useNotification } from "../../context/Notification";

const badgeClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (s === "pending") return "bg-amber-50 text-amber-700 border-amber-100";
  if (s === "failed") return "bg-red-50 text-red-700 border-red-100";
  if (s === "expired") return "bg-gray-100 text-gray-700 border-gray-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const fmtMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  const fixed = n.toFixed(2);
  return fixed.endsWith(".00") ? String(Math.round(n)) : fixed;
};

const shortId = (value) => {
  const s = String(value || "");
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
};

const AdminPayments = () => {
  const notify = useNotification();

  const [tab, setTab] = useState("orders"); // orders | purchases
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [purchaseTotal, setPurchaseTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, purchasesRes] = await Promise.all([
        fetchPaymentOrders({ status, limit: 100 }),
        fetchPurchases({ limit: 100 }),
      ]);
      setOrders(Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);
      setOrderStats(ordersRes.data?.stats ?? null);
      setPurchases(Array.isArray(purchasesRes.data?.purchases) ? purchasesRes.data.purchases : []);
      setPurchaseTotal(Number(purchasesRes.data?.total) || 0);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load payments data";
      setError(message);
      notify.error("Payments Error", message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const userEmail = o?.user?.email || "";
      const userName = o?.user?.name || "";
      const bookTitle = o?.book?.title || "";
      const ref = o?.paymentReference || "";
      const id = o?._id || "";
      return (
        String(id).toLowerCase().includes(q) ||
        String(ref).toLowerCase().includes(q) ||
        String(userEmail).toLowerCase().includes(q) ||
        String(userName).toLowerCase().includes(q) ||
        String(bookTitle).toLowerCase().includes(q)
      );
    });
  }, [orders, search]);

  const filteredPurchases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p) => {
      const userEmail = p?.user?.email || "";
      const userName = p?.user?.name || "";
      const bookTitle = p?.book?.title || "";
      const id = p?._id || "";
      return (
        String(id).toLowerCase().includes(q) ||
        String(userEmail).toLowerCase().includes(q) ||
        String(userName).toLowerCase().includes(q) ||
        String(bookTitle).toLowerCase().includes(q)
      );
    });
  }, [purchases, search]);

  return (
    <div className="flex">
      <AdminNavbar />
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              <p className="text-sm text-gray-500 mt-1">Dummy payment orders and purchased access records.</p>
            </div>
            <button
              onClick={load}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500">Paid orders</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{orderStats?.paidOrders ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500">Pending orders</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{orderStats?.pendingOrders ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500">Revenue (paid)</p>
              <p className="text-xl font-bold text-gray-900 mt-1">Rs. {fmtMoney(orderStats?.paidAmount ?? 0)}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500">Purchases</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{purchaseTotal}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap">
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setTab("orders")}
                className={`px-3 py-2 text-sm font-semibold ${tab === "orders" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"}`}
              >
                Orders ({orders.length})
              </button>
              <button
                onClick={() => setTab("purchases")}
                className={`px-3 py-2 text-sm font-semibold ${tab === "purchases" ? "bg-indigo-600 text-white" : "bg-white text-gray-700"}`}
              >
                Purchases ({purchases.length})
              </button>
            </div>

            {tab === "orders" ? (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="expired">Expired</option>
              </select>
            ) : null}

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user/book/order id…"
              className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
            />

            {tab === "orders" ? (
              <button
                onClick={load}
                className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-semibold"
              >
                Apply
              </button>
            ) : null}
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">{error}</div>
          ) : null}

          {loading ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-sm text-gray-600">Loading…</div>
          ) : tab === "orders" ? (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Order</th>
                      <th className="text-left px-4 py-3 font-semibold">User</th>
                      <th className="text-left px-4 py-3 font-semibold">Book</th>
                      <th className="text-left px-4 py-3 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 font-semibold">Amount</th>
                      <th className="text-left px-4 py-3 font-semibold">Reference</th>
                      <th className="text-left px-4 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{shortId(o._id)}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{o?.user?.name || "—"}</div>
                            <div className="text-xs text-gray-500">{o?.user?.email || "—"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{o?.book?.title || "—"}</div>
                            <div className="text-xs text-gray-500">{o?.book?.isPaid ? `Rs. ${o?.book?.price}` : "Free"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass(o.status)}`}>
                              {String(o.status || "").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            Rs. {fmtMoney(o?.amount ?? (Number(o?.amountMinor) / 100))}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{o?.paymentReference || "—"}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(o.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Purchase</th>
                      <th className="text-left px-4 py-3 font-semibold">User</th>
                      <th className="text-left px-4 py-3 font-semibold">Book</th>
                      <th className="text-left px-4 py-3 font-semibold">Purchased At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          No purchases found.
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-700">{shortId(p._id)}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{p?.user?.name || "—"}</div>
                            <div className="text-xs text-gray-500">{p?.user?.email || "—"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{p?.book?.title || "—"}</div>
                            <div className="text-xs text-gray-500">{p?.book?.isPaid ? `Rs. ${p?.book?.price}` : "Free"}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{fmtDate(p.purchasedAt || p.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
