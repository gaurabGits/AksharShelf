import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "../Components/adminNavbar";
import {
  fetchPaymentOrders,
  fetchPurchases,
  grantPurchaseAccess,
  updatePurchaseAccess,
} from "../adminAPI";
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
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
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
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
};

const KeyValue = ({ label, children }) => (
  <div className="min-w-0">
    <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
    <div className="mt-1 text-sm text-gray-900 break-words">{children}</div>
  </div>
);

const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 p-4 sm:p-6 flex items-end sm:items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
            <p className="text-sm sm:text-base font-bold text-gray-900">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
          <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto">{children}</div>
          {footer ? (
            <div className="px-4 sm:px-5 py-3.5 border-t border-gray-100 bg-gray-50">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default function AdminPayments() {
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

  const [details, setDetails] = useState(null); // { type: 'order'|'purchase', item }
  const [grantOpen, setGrantOpen] = useState(false);

  const [granting, setGranting] = useState(false);
  const [grantForm, setGrantForm] = useState({
    userId: "",
    bookId: "",
    durationDays: "30",
    neverExpire: false,
    adminNote: "",
  });

  const [purchaseEdit, setPurchaseEdit] = useState({
    durationDays: "30",
    adminNote: "",
  });

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

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshPurchases = async () => {
    const purchasesRes = await fetchPurchases({ limit: 100 });
    setPurchases(Array.isArray(purchasesRes.data?.purchases) ? purchasesRes.data.purchases : []);
    setPurchaseTotal(Number(purchasesRes.data?.total) || 0);
  };

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
      const id = p?._id || p?.id || "";
      return (
        String(id).toLowerCase().includes(q) ||
        String(userEmail).toLowerCase().includes(q) ||
        String(userName).toLowerCase().includes(q) ||
        String(bookTitle).toLowerCase().includes(q)
      );
    });
  }, [purchases, search]);

  const handleGrant = async (e) => {
    e.preventDefault();
    const userId = grantForm.userId.trim();
    const bookId = grantForm.bookId.trim();
    if (!userId || !bookId) {
      notify.error("Grant failed", "User ID and Book ID are required.");
      return;
    }

    setGranting(true);
    try {
      const payload = {
        userId,
        bookId,
        adminNote: grantForm.adminNote.trim() || undefined,
      };

      if (grantForm.neverExpire) {
        payload.neverExpire = true;
      } else {
        const days = Number(grantForm.durationDays);
        if (!Number.isFinite(days) || days <= 0) {
          notify.error("Grant failed", "Duration days must be a positive number.");
          return;
        }
        payload.durationDays = days;
      }

      await grantPurchaseAccess(payload);
      notify.success("Access granted", "Purchase access has been created/updated.");
      await refreshPurchases();
      setGrantForm((p) => ({ ...p, userId: "", bookId: "", adminNote: "" }));
      setGrantOpen(false);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to grant access.";
      notify.error("Grant failed", message);
    } finally {
      setGranting(false);
    }
  };

  const updateAccess = async (purchaseId, payload, successMessage) => {
    try {
      const res = await updatePurchaseAccess(purchaseId, payload);
      notify.success("Updated", successMessage);
      await refreshPurchases();

      const updated = res.data?.purchase;
      if (updated && details?.type === "purchase" && details?.item?._id === purchaseId) {
        setDetails({ type: "purchase", item: updated });
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update access.";
      notify.error("Update failed", message);
    }
  };

  const openOrderDetails = (order) => setDetails({ type: "order", item: order });
  const openPurchaseDetails = (purchase) => {
    setPurchaseEdit({
      durationDays: "30",
      adminNote: String(purchase?.adminNote || ""),
    });
    setDetails({ type: "purchase", item: purchase });
  };

  const orderDetail = details?.type === "order" ? details.item : null;
  const purchaseDetail = details?.type === "purchase" ? details.item : null;

  return (
    <div className="flex">
      <AdminNavbar />

      <div className="flex-1 p-4 sm:p-6 bg-gray-50 min-h-screen pt-20 md:pt-6">
        <div className="w-full space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              <p className="text-sm text-gray-500 mt-1">Orders and purchased access records.</p>
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
              placeholder="Search by user/book/order id..."
              className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
            />

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGrantOpen(true)}
                className={`px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold ${
                  tab === "purchases" ? "" : "invisible pointer-events-none"
                }`}
              >
                Grant access
              </button>

              <button
                type="button"
                onClick={load}
                className={`px-3 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-semibold ${
                  tab === "orders" ? "" : "invisible pointer-events-none"
                }`}
              >
                Apply
              </button>
            </div>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4 text-sm">{error}</div>
          ) : null}

          {loading ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-sm text-gray-600">Loading...</div>
          ) : tab === "orders" ? (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold w-[55%]">Order</th>
                      <th className="text-left px-4 py-3 font-semibold w-28 whitespace-nowrap">Status</th>
                      <th className="text-left px-4 py-3 font-semibold w-32 whitespace-nowrap">Amount</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 font-semibold w-44 whitespace-nowrap">Created</th>
                      <th className="text-right px-4 py-3 font-semibold w-20 whitespace-nowrap">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => openOrderDetails(o)} className="text-left group w-full min-w-0">
                              <div className="font-semibold text-gray-900 group-hover:underline decoration-gray-300 truncate">
                                {o?.book?.title || "-"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {o?.user?.name ? `${o.user.name}` : "User: -"}
                                {o?.user?.email ? ` (${o.user.email})` : ""}
                              </div>
                              <div className="mt-1 font-mono text-[11px] text-gray-500 truncate">
                                Order: {shortId(o._id)}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-semibold ${badgeClass(o.status)}`}>
                              {String(o.status || "").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                            Rs. {fmtMoney(o?.amount ?? (Number(o?.amountMinor) / 100))}
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openOrderDetails(o)}
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline"
                            >
                              View
                            </button>
                          </td>
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
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold w-[55%]">Purchase</th>
                      <th className="text-left px-4 py-3 font-semibold w-48 whitespace-nowrap">Access</th>
                      <th className="hidden md:table-cell text-left px-4 py-3 font-semibold w-44 whitespace-nowrap">Purchased</th>
                      <th className="text-right px-4 py-3 font-semibold w-20 whitespace-nowrap">Manage</th>
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
                        <tr key={p._id || p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => openPurchaseDetails(p)} className="text-left group w-full min-w-0">
                              <div className="font-semibold text-gray-900 group-hover:underline decoration-gray-300 truncate">
                                {p?.book?.title || "-"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {p?.user?.name ? `User: ${p.user.name}` : "User: -"}
                                {p?.user?.email ? ` (${p.user.email})` : ""}
                              </div>
                              <div className="mt-1 font-mono text-[11px] text-gray-500 truncate">
                                Purchase: {shortId(p._id || p.id)}
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">
                                {p?.expiresAt ? fmtDate(p.expiresAt) : "Never"}
                              </span>
                              {p?.isExpired ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold bg-red-50 text-red-700 border-red-100">
                                  EXPIRED
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(p.purchasedAt || p.createdAt)}</td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openPurchaseDetails(p)}
                              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 underline"
                            >
                              Manage
                            </button>
                          </td>
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

      <Modal open={grantOpen} title="Grant access" onClose={() => setGrantOpen(false)}>
        <form onSubmit={handleGrant} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={grantForm.userId}
              onChange={(e) => setGrantForm((p) => ({ ...p, userId: e.target.value }))}
              placeholder="User ID"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
            />
            <input
              value={grantForm.bookId}
              onChange={(e) => setGrantForm((p) => ({ ...p, bookId: e.target.value }))}
              placeholder="Book ID"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={grantForm.durationDays}
              onChange={(e) => setGrantForm((p) => ({ ...p, durationDays: e.target.value }))}
              placeholder="Duration days (e.g. 30)"
              disabled={grantForm.neverExpire}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none disabled:bg-gray-50"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={grantForm.neverExpire}
                onChange={(e) => setGrantForm((p) => ({ ...p, neverExpire: e.target.checked }))}
              />
              Never expire
            </label>
          </div>

          <input
            value={grantForm.adminNote}
            onChange={(e) => setGrantForm((p) => ({ ...p, adminNote: e.target.value }))}
            placeholder="Admin note (optional)"
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none w-full"
          />

          <button
            type="submit"
            disabled={granting}
            className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            {granting ? "Granting..." : "Grant"}
          </button>
        </form>
      </Modal>

      <Modal
        open={Boolean(orderDetail)}
        title="Order details"
        onClose={() => setDetails(null)}
      >
        {orderDetail ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KeyValue label="Order ID"><span className="font-mono text-xs">{orderDetail._id}</span></KeyValue>
            <KeyValue label="Status">{String(orderDetail.status || "-")}</KeyValue>
            <KeyValue label="Amount">Rs. {fmtMoney(orderDetail.amount ?? (Number(orderDetail.amountMinor) / 100))}</KeyValue>
            <KeyValue label="Currency">{orderDetail.currency || "-"}</KeyValue>
            <KeyValue label="Provider">{orderDetail.provider || "-"}</KeyValue>
            <KeyValue label="Reference"><span className="font-mono text-xs">{orderDetail.paymentReference || "-"}</span></KeyValue>
            <KeyValue label="Created">{fmtDate(orderDetail.createdAt)}</KeyValue>
            <KeyValue label="Expires">{fmtDate(orderDetail.expiresAt)}</KeyValue>
            <KeyValue label="Paid at">{fmtDate(orderDetail.paidAt)}</KeyValue>
            <KeyValue label="Failure">{orderDetail.failureReason || "-"}</KeyValue>
            <KeyValue label="User">
              <div className="text-sm">
                <div className="font-semibold">{orderDetail?.user?.name || "-"}</div>
                <div className="text-xs text-gray-500">{orderDetail?.user?.email || "-"}</div>
              </div>
            </KeyValue>
            <KeyValue label="Book">
              <div className="text-sm">
                <div className="font-semibold">{orderDetail?.book?.title || "-"}</div>
                <div className="text-xs text-gray-500">{orderDetail?.book?.isPaid ? `Paid (Rs. ${orderDetail?.book?.price})` : "Free"}</div>
              </div>
            </KeyValue>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(purchaseDetail)}
        title="Purchase details"
        onClose={() => setDetails(null)}
        footer={
          purchaseDetail ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-gray-500">
                Quick actions update access expiry.
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => updateAccess(purchaseDetail._id, { durationDays: 30 }, "Access set to 30 days.")}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white"
                >
                  +30d
                </button>
                <button
                  type="button"
                  onClick={() => updateAccess(purchaseDetail._id, { neverExpire: true }, "Access set to never expire.")}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-white"
                >
                  Never
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("Revoke access now?")) return;
                    updateAccess(purchaseDetail._id, { revoke: true }, "Access revoked.");
                  }}
                  className="px-3 py-2 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Revoke
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {purchaseDetail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KeyValue label="Purchase ID"><span className="font-mono text-xs">{purchaseDetail._id}</span></KeyValue>
              <KeyValue label="Purchased">{fmtDate(purchaseDetail.purchasedAt || purchaseDetail.createdAt)}</KeyValue>
              <KeyValue label="Access expires">{purchaseDetail.expiresAt ? fmtDate(purchaseDetail.expiresAt) : "Never"}</KeyValue>
              <KeyValue label="Status">{purchaseDetail.isExpired ? "Expired" : "Active"}</KeyValue>
              <KeyValue label="Source">{purchaseDetail.grantSource || "payment"}</KeyValue>
              <KeyValue label="Granted by">{purchaseDetail?.grantedBy?.username || "-"}</KeyValue>
              <KeyValue label="User">
                <div className="text-sm">
                  <div className="font-semibold">{purchaseDetail?.user?.name || "-"}</div>
                  <div className="text-xs text-gray-500">{purchaseDetail?.user?.email || "-"}</div>
                </div>
              </KeyValue>
              <KeyValue label="Book">
                <div className="text-sm">
                  <div className="font-semibold">{purchaseDetail?.book?.title || "-"}</div>
                  <div className="text-xs text-gray-500">{purchaseDetail?.book?.isPaid ? `Paid (Rs. ${purchaseDetail?.book?.price})` : "Free"}</div>
                </div>
              </KeyValue>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-gray-900">Update access</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={purchaseEdit.durationDays}
                  onChange={(e) => setPurchaseEdit((p) => ({ ...p, durationDays: e.target.value }))}
                  placeholder="Duration days (e.g. 30)"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const days = Number(purchaseEdit.durationDays);
                    if (!Number.isFinite(days) || days <= 0) {
                      notify.error("Invalid days", "Duration days must be a positive number.");
                      return;
                    }
                    updateAccess(purchaseDetail._id, { durationDays: days }, `Access set to ${days} days.`);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-sm font-semibold"
                >
                  Set duration
                </button>
              </div>

              <input
                value={purchaseEdit.adminNote}
                onChange={(e) => setPurchaseEdit((p) => ({ ...p, adminNote: e.target.value }))}
                placeholder="Admin note (optional)"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none bg-white w-full"
              />
              <button
                type="button"
                onClick={() => updateAccess(purchaseDetail._id, { adminNote: purchaseEdit.adminNote }, "Admin note updated.")}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-white"
              >
                Save note
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
