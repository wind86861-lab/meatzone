import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, Phone, Package, CheckCircle, Clock, AlertCircle, LogOut, User, Navigation, Banknote, ArrowUpCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

function DriverDashboard() {
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [cashSummary, setCashSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('my');
  const [loading, setLoading] = useState(false);
  const [cashLoading, setCashLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'driver') { navigate('/'); return; }
    fetchOrders();
    fetchAvailableOrders();
    fetchCashSummary();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders/driver/my-orders');
      setOrders(data);
    } catch { setError('Buyurtmalarni yuklashda xatolik'); }
    finally { setLoading(false); }
  };

  const fetchAvailableOrders = async () => {
    try {
      const { data } = await api.get('/orders/driver/available');
      setAvailableOrders(data);
    } catch { /* silent */ }
  };

  const fetchCashSummary = async () => {
    try {
      setCashLoading(true);
      const { data } = await api.get('/orders/driver/cash-summary');
      setCashSummary(data);
    } catch { /* silent */ }
    finally { setCashLoading(false); }
  };

  const assignOrder = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/assign-driver`);
      fetchOrders();
      fetchAvailableOrders();
    } catch (err) { setError(err.response?.data?.message || 'Xatolik yuz berdi'); }
  };

  const updateDeliveryStatus = async (orderId, status) => {
    try {
      await api.post(`/orders/${orderId}/delivery-status`, { status });
      fetchOrders();
    } catch (err) { setError(err.response?.data?.message || 'Xatolik yuz berdi'); }
  };

  const confirmCash = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/driver/confirm-cash`);
      fetchOrders();
      fetchCashSummary();
      showSuccess('Naqd pul qabul qilindi ✓');
    } catch (err) { setError(err.response?.data?.message || 'Xatolik'); }
  };

  const submitCashToAdmin = async () => {
    try {
      setSubmitting(true);
      const { data } = await api.post('/orders/driver/submit-cash');
      fetchCashSummary();
      showSuccess(`${data.count} ta buyurtma uchun ${data.total?.toLocaleString()} so'm admin ga topshirildi ✓`);
    } catch (err) { setError(err.response?.data?.message || 'Xatolik'); }
    finally { setSubmitting(false); }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const statusConfig = {
    new: { label: 'Yangi', color: 'bg-blue-100 text-blue-700', icon: Clock },
    confirmed: { label: 'Tasdiqlangan', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    processing: { label: 'Tayyorlanmoqda', color: 'bg-yellow-100 text-yellow-700', icon: Package },
    delivered: { label: 'Yetkazildi', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    completed: { label: 'Yakunlandi', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { label: 'Bekor qilindi', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  };

  const deliveryStatusConfig = {
    pending: { label: 'Kutilmoqda', color: 'bg-gray-100 text-gray-600' },
    assigned: { label: 'Tayinlangan', color: 'bg-indigo-100 text-indigo-700' },
    in_transit: { label: "Yo'lda", color: 'bg-amber-100 text-amber-700' },
    delivered: { label: 'Yetkazildi', color: 'bg-emerald-100 text-emerald-700' },
    failed: { label: 'Yetkazib berilmadi', color: 'bg-red-100 text-red-700' },
  };

  const isCashOrder = (order) => order.paymentMethod === 'cash';
  const isOrderDelivered = (order) =>
    order.deliveryStatus === 'delivered' ||
    order.status === 'completed' ||
    order.status === 'delivered';
  const needsCashConfirm = (order) =>
    isCashOrder(order) &&
    isOrderDelivered(order) &&
    !order.cashReceivedByCourier;

  const renderOrderCard = (order, isAvailable = false) => {
    const status = statusConfig[order.status] || statusConfig.new;
    const delStatus = deliveryStatusConfig[order.deliveryStatus || 'pending'];
    const StatusIcon = status.icon;

    return (
      <motion.div
        key={order._id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">#{order.orderNumber || order._id?.slice(-6)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                  <StatusIcon size={12} className="inline mr-1" />
                  {status.label}
                </span>
                {isCashOrder(order) && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                    <Banknote size={11} />
                    Naqd
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock size={14} />
                {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{order.totalPrice?.toLocaleString()} so'm</div>
              {!order.isFreeDelivery && order.deliveryFee > 0 && (
                <div className="text-xs text-gray-400">+ yetkazish {order.deliveryFee?.toLocaleString()} so'm</div>
              )}
              {order.isFreeDelivery && (
                <div className="text-xs text-emerald-600 font-medium">Bepul yetkazish</div>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <User size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">{order.customerName || 'Mijoz'}</div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Phone size={12} />
                  {order.customerPhone}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="text-sm text-gray-700">
                {order.address}
                {order.district && <span className="text-gray-400"> · {order.district}</span>}
              </div>
            </div>
            {order.comment && (
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm text-gray-600 italic">{order.comment}</div>
              </div>
            )}
          </div>

          {order.items && order.items.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Mahsulotlar</div>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-white" />}
                      <span className="text-gray-700 line-clamp-1">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-medium shrink-0">{item.quantity} x {item.price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isAvailable && (
            <div className="flex items-center gap-2 mb-3">
              <Truck size={16} className="text-gray-400" />
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${delStatus.color}`}>{delStatus.label}</span>
              {order.cashReceivedByCourier && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                  <CheckCircle size={11} />
                  Naqd qabul qilindi
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {isAvailable ? (
              <button
                onClick={() => assignOrder(order._id)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Navigation size={16} />
                Olib ketish
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {order.deliveryStatus === 'assigned' && (
                    <button
                      onClick={() => updateDeliveryStatus(order._id, 'in_transit')}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Truck size={16} />
                      Yo'ldaman
                    </button>
                  )}
                  {order.deliveryStatus === 'in_transit' && (
                    <>
                      <button
                        onClick={() => updateDeliveryStatus(order._id, 'delivered')}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Yetkazildi
                      </button>
                      <button
                        onClick={() => updateDeliveryStatus(order._id, 'failed')}
                        className="px-4 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold py-2.5 rounded-xl transition-colors"
                      >
                        <AlertCircle size={16} />
                      </button>
                    </>
                  )}
                  {(isOrderDelivered(order) || order.deliveryStatus === 'failed') && !needsCashConfirm(order) && (
                    <div className={`flex-1 text-sm font-semibold py-2.5 rounded-xl text-center flex items-center justify-center gap-2 ${order.deliveryStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      <CheckCircle size={16} />
                      {order.deliveryStatus === 'delivered' ? 'Yetkazildi' : 'Yetkazib berilmadi'}
                    </div>
                  )}
                </div>
                {needsCashConfirm(order) && (
                  <button
                    onClick={() => confirmCash(order._id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Banknote size={16} />
                    Naqd pul qabul qildim — {order.totalPrice?.toLocaleString()} so'm
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCashTab = () => {
    if (cashLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    const pending = cashSummary?.pending || [];
    const pendingTotal = cashSummary?.pendingTotal || 0;
    const submittedTotal = cashSummary?.submittedTotal || 0;

    return (
      <div className="space-y-4 pb-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs font-semibold text-gray-500 mb-1">Kutayotgan (topshirilmagan)</div>
            <div className="text-2xl font-bold text-orange-600">{pendingTotal.toLocaleString()}</div>
            <div className="text-xs text-gray-400">so'm · {pending.length} ta</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs font-semibold text-gray-500 mb-1">Jami topshirilgan</div>
            <div className="text-2xl font-bold text-emerald-600">{submittedTotal.toLocaleString()}</div>
            <div className="text-xs text-gray-400">so'm · {cashSummary?.submitted || 0} ta</div>
          </div>
        </div>

        {/* Submit button */}
        {pending.length > 0 && (
          <button
            onClick={submitCashToAdmin}
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUpCircle size={18} />
            )}
            Adminga topshirish — {pendingTotal.toLocaleString()} so'm
          </button>
        )}

        {/* Pending orders list */}
        {pending.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Topshirilmagan buyurtmalar
            </div>
            {pending.map((o, i) => (
              <div key={o._id} className={`px-4 py-3 flex items-center justify-between ${i < pending.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div>
                  <div className="text-sm font-medium text-gray-900">{o.customerName || `#${o._id?.slice(-6)}`}</div>
                  <div className="text-xs text-gray-400">{o.cashReceivedAt ? new Date(o.cashReceivedAt).toLocaleDateString('uz-UZ') : ''}</div>
                </div>
                <div className="text-sm font-bold text-gray-900">{o.totalPrice?.toLocaleString()} so'm</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CheckCircle size={48} className="text-emerald-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Barcha naqd pul topshirilgan</p>
          </div>
        )}

        <button
          onClick={fetchCashSummary}
          className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-500 text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Yangilash
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Truck className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Haydovchi paneli</h1>
                <p className="text-xs text-gray-500">{user?.name || 'Haydovchi'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'my', label: 'Buyurtmalarim', count: orders.length },
            { key: 'available', label: 'Mavjud', count: availableOrders.length },
            { key: 'cash', label: 'Naqd pul', count: cashSummary?.pending?.length || 0, highlight: (cashSummary?.pendingTotal || 0) > 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === tab.key
                  ? tab.highlight ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'
                  : tab.highlight ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className="ml-1 opacity-80">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle size={16} />
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && activeTab !== 'cash' ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'my' && (
              <motion.div key="my" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pb-8">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Hozircha sizga tayinlangan buyurtmalar yo'q</p>
                    <button onClick={() => setActiveTab('available')} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
                      Mavjud buyurtmalarni ko'rish
                    </button>
                  </div>
                ) : (
                  orders.map(order => renderOrderCard(order))
                )}
              </motion.div>
            )}
            {activeTab === 'available' && (
              <motion.div key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 pb-8">
                {availableOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Hozircha mavjud buyurtmalar yo'q</p>
                  </div>
                ) : (
                  availableOrders.map(order => renderOrderCard(order, true))
                )}
              </motion.div>
            )}
            {activeTab === 'cash' && (
              <motion.div key="cash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderCashTab()}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default DriverDashboard;
