import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import API from "../services/api";
import { useNotification } from "../context/Notification";

const IDEM_PREFIX = "purchase_idem_v1:";

const digitsOnly = (value) => String(value ?? "").replace(/[^\d]/g, "");

function PurchasePage() {
  const { id: bookId } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();

  const [book, setBook] = useState(null);
  const [access, setAccess] = useState({ canRead: false });
  const [loadingBook, setLoadingBook] = useState(true);
  const [bookError, setBookError] = useState("");

  const [order, setOrder] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState(() => ({
    cardNumber: "4242 4242 4242 4242",
    expMonth: "12",
    expYear: "2030",
    cvc: "123",
    name: "",
  }));

  const idemStorageKey = useMemo(() => `${IDEM_PREFIX}${bookId}`, [bookId]);
  const [idempotencyKey, setIdempotencyKey] = useState(() => {
    const existing = sessionStorage.getItem(`${IDEM_PREFIX}${bookId}`);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(`${IDEM_PREFIX}${bookId}`, created);
    return created;
  });

  useEffect(() => {
    const existing = sessionStorage.getItem(idemStorageKey);
    if (existing) {
      setIdempotencyKey(existing);
      return;
    }
    const created = crypto.randomUUID();
    sessionStorage.setItem(idemStorageKey, created);
    setIdempotencyKey(created);
  }, [idemStorageKey]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoadingBook(true);
        setBookError("");
        const res = await API.get(`/books/${bookId}`);
        if (!mounted) return;
        setBook(res.data.book);
        setAccess(res.data.access ?? { canRead: false });
      } catch (err) {
        if (!mounted) return;
        setBookError(err.response?.data?.message || "Failed to load book.");
      } finally {
        if (mounted) setLoadingBook(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [bookId]);

  const startCheckout = async ({ resetIdempotency = false } = {}) => {
    try {
      setCheckoutLoading(true);
      setCheckoutError("");
      setPayError("");

      if (resetIdempotency) {
        sessionStorage.removeItem(idemStorageKey);
      }

      const keyToUse = resetIdempotency ? crypto.randomUUID() : idempotencyKey;
      if (resetIdempotency) {
        sessionStorage.setItem(idemStorageKey, keyToUse);
        setIdempotencyKey(keyToUse);
      }

      const res = await API.post(
        `/payments/books/${bookId}/checkout`,
        {},
        { headers: { "Idempotency-Key": keyToUse } }
      );

      setOrder(res.data.order);
      if (res.data.access?.canRead) setAccess({ canRead: true });
    } catch (err) {
      const message = err.response?.data?.message || "Failed to start checkout.";
      setCheckoutError(message);
      notify.error("Checkout failed", message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const confirmPayment = async (e) => {
    e.preventDefault();
    if (!order?.id || !order?.clientSecret) {
      setPayError("Missing order details. Start checkout first.");
      return;
    }

    try {
      setPaying(true);
      setPayError("");

      const payload = {
        clientSecret: order.clientSecret,
        paymentMethod: {
          cardNumber: digitsOnly(paymentMethod.cardNumber),
          expMonth: Number(paymentMethod.expMonth),
          expYear: Number(paymentMethod.expYear),
          cvc: digitsOnly(paymentMethod.cvc),
          name: paymentMethod.name,
        },
      };

      const res = await API.post(`/payments/orders/${order.id}/confirm`, payload);
      setOrder((prev) => (prev ? { ...prev, ...res.data.order } : res.data.order));
      setAccess(res.data.access ?? { canRead: true });
      notify.success("Payment successful", "Access unlocked.");
    } catch (err) {
      const message = err.response?.data?.message || "Payment failed.";
      setPayError(message);
      notify.error("Payment failed", message);
    } finally {
      setPaying(false);
    }
  };

  if (loadingBook) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading…
      </div>
    );
  }

  if (bookError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
          <p className="text-sm text-red-600 dark:text-red-400">{bookError}</p>
          <div className="mt-4">
            <Link to="/books" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Back to books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const alreadyHasAccess = Boolean(access?.canRead);
  const isPaid = Boolean(book?.isPaid);
  const wasJustPaid = alreadyHasAccess && String(order?.status || "").toLowerCase() === "paid";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="page-container py-8">
        <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Checkout</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {book?.title} {isPaid ? `· Rs. ${book?.price}` : "· Free"}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {alreadyHasAccess ? (
              <div className="rounded-xl border border-emerald-100 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {wasJustPaid ? "Payment successful. You now have access to this book." : "You already have access to this book."}
                </p>
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate(`/read/${bookId}`)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
                  >
                    Read now
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/books/${bookId}`)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white/60 dark:bg-transparent text-emerald-800 dark:text-emerald-200 text-sm font-semibold hover:bg-white transition-colors"
                  >
                    Back to book
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Dummy payment</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Use test card <span className="font-mono">4242424242424242</span> for success or{" "}
                        <span className="font-mono">4000000000000002</span> for decline.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCheckout({ resetIdempotency: false })}
                      disabled={checkoutLoading}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {checkoutLoading ? "Starting…" : order ? "Refresh checkout" : "Start checkout"}
                    </button>
                  </div>

                  {checkoutError ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-3">{checkoutError}</p>
                  ) : null}

                  {order ? (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300">
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>{" "}
                        <span className="font-semibold">{order.status}</span>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                        <span className="text-gray-500 dark:text-gray-400">Amount:</span>{" "}
                        <span className="font-semibold">Rs. {order.amount}</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <form onSubmit={confirmPayment} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Card number
                      </label>
                      <input
                        value={paymentMethod.cardNumber}
                        onChange={(e) => setPaymentMethod((p) => ({ ...p, cardNumber: e.target.value }))}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Exp month
                      </label>
                      <input
                        value={paymentMethod.expMonth}
                        onChange={(e) => setPaymentMethod((p) => ({ ...p, expMonth: e.target.value }))}
                        placeholder="12"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Exp year
                      </label>
                      <input
                        value={paymentMethod.expYear}
                        onChange={(e) => setPaymentMethod((p) => ({ ...p, expYear: e.target.value }))}
                        placeholder="2030"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        CVC
                      </label>
                      <input
                        value={paymentMethod.cvc}
                        onChange={(e) => setPaymentMethod((p) => ({ ...p, cvc: e.target.value }))}
                        placeholder="123"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Name (optional)
                      </label>
                      <input
                        value={paymentMethod.name}
                        onChange={(e) => setPaymentMethod((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Cardholder name"
                        className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {payError ? <p className="text-xs text-red-600 dark:text-red-400">{payError}</p> : null}

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => startCheckout({ resetIdempotency: true })}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                    >
                      Start a new checkout
                    </button>
                    <button
                      type="submit"
                      disabled={paying || checkoutLoading || !order}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {paying ? "Processing…" : "Pay now (dummy)"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default PurchasePage;
