import React, { useState, useEffect } from 'react';
import { Banknote, RefreshCw, CheckCircle, XCircle, Clock, User, Package, Calendar, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function AdminCashHandovers() {
  const [handovers, setHandovers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [handoversRes, statsRes] = await Promise.all([
        api.get('/cash-handovers', { params: { status: filter === 'all' ? undefined : filter } }),
        api.get('/cash-handovers/stats'),
      ]);
      setHandovers(handoversRes.data.handovers);
      setStats(statsRes.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleConfirm = async (id) => {
    if (!confirm('Pul qabul qilinganini tasdiqlaysizmi?')) return;
    try {
      setActionLoading(true);
      await api.put(`/cash-handovers/${id}/confirm`);
      await fetchData();
      setSelectedHandover(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const notes = prompt('Rad etish sababi (ixtiyoriy):');
    if (notes === null) return;
    try {
      setActionLoading(true);
      await api.put(`/cash-handovers/${id}/reject`, { notes });
      await fetchData();
      setSelectedHandover(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Xatolik');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Kutilmoqda' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Tasdiqlangan' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rad etilgan' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={13} />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Naqd pul topshirish</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kurerlar tomonidan topshirilgan naqd pullar</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-yellow-600 mb-2">
              <Clock size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Kutilmoqda</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stats.totalPendingAmount.toLocaleString()} so'm</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Tasdiqlangan</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.confirmed}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stats.totalConfirmedAmount.toLocaleString()} so'm</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <XCircle size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Rad etilgan</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.rejected}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Banknote size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Jami</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.pending + stats.confirmed + stats.rejected}</div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {['pending', 'confirmed', 'rejected', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'pending' && 'Kutilmoqda'}
            {f === 'confirmed' && 'Tasdiqlangan'}
            {f === 'rejected' && 'Rad etilgan'}
            {f === 'all' && 'Barchasi'}
          </button>
        ))}
      </div>

      {/* Handovers list */}
      {loading && !handovers.length ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : handovers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Banknote size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Hozircha topshirilgan pul yo'q</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {handovers.map((h) => (
              <div key={h._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                      <User size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{h.courierName}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Calendar size={14} />
                        {new Date(h.submittedAt).toLocaleString('uz-UZ', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(h.status)}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Topshirilgan summa</div>
                    <div className="text-lg font-bold text-gray-900">{h.submittedAmount.toLocaleString()} so'm</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Buyurtmalar</div>
                    <div className="flex items-center gap-1.5">
                      <Package size={16} className="text-gray-400" />
                      <span className="text-lg font-bold text-gray-900">{h.orderCount} ta</span>
                    </div>
                  </div>
                  {h.discrepancy !== 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Farq</div>
                      <div className={`text-lg font-bold ${h.discrepancy > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {h.discrepancy > 0 ? '+' : ''}{h.discrepancy.toLocaleString()} so'm
                      </div>
                    </div>
                  )}
                </div>

                {h.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirm(h._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <CheckCircle size={16} />
                      Tasdiqlash
                    </button>
                    <button
                      onClick={() => handleReject(h._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <XCircle size={16} />
                      Rad etish
                    </button>
                  </div>
                )}

                {h.status !== 'pending' && h.confirmedByName && (
                  <div className="text-xs text-gray-500 mt-2">
                    {h.status === 'confirmed' ? 'Tasdiqlagan' : 'Rad etgan'}: {h.confirmedByName} • {new Date(h.confirmedAt).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
