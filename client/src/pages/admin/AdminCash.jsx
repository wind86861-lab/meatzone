import React, { useState, useEffect } from 'react'
import { Banknote, RefreshCw, TrendingUp, AlertCircle, CheckCircle, User } from 'lucide-react'
import api from '../../services/api'

export default function AdminCash() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetch = async () => {
    try {
      setLoading(true)
      setError('')
      const { data: d } = await api.get('/orders/admin/cash-summary')
      setData(d)
    } catch (e) {
      setError(e.response?.data?.message || 'Xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const totalPending = data?.drivers?.reduce((s, d) => s + d.pendingTotal, 0) || 0
  const totalSubmitted = data?.drivers?.reduce((s, d) => s + d.submittedTotal, 0) || 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Naqd pul hisobi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Haydovchilar tomonidan yig'ilgan naqd pullar</p>
        </div>
        <button
          onClick={fetch}
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

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <Banknote size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Topshirilmagan</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalPending.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-0.5">so'm</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Jami topshirilgan</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalSubmitted.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-0.5">so'm</div>
        </div>
      </div>

      {/* Per-driver table */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.drivers?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Banknote size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Hozircha naqd pul ma'lumotlari yo'q</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">Haydovchilar bo'yicha</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.drivers?.map((d, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                  <User size={16} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{d.driverName}</div>
                  {d.driverPhone && <div className="text-xs text-gray-400">{d.driverPhone}</div>}
                </div>
                <div className="text-right shrink-0">
                  {d.pendingTotal > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                        {d.pendingTotal.toLocaleString()} so'm kutayapti ({d.pendingCount} ta)
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle size={13} />
                      Barchasi topshirilgan
                    </div>
                  )}
                  {d.submittedTotal > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      Jami topshirilgan: {d.submittedTotal.toLocaleString()} so'm
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
