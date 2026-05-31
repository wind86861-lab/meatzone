import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, UserCheck, Truck, Shield, User, Phone, Mail, Calendar, ChevronRight } from 'lucide-react'
import { usersAPI } from '../../services/api'

const ROLE_LABELS = {
  customer: { label: 'Mijoz', color: 'bg-gray-100 text-gray-700', icon: User },
  driver: { label: 'Kurer 🚚', color: 'bg-blue-100 text-blue-700', icon: Truck },
  operator: { label: 'Operator', color: 'bg-purple-100 text-purple-700', icon: UserCheck },
  manager: { label: 'Menejer', color: 'bg-orange-100 text-orange-700', icon: UserCheck },
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700', icon: Shield },
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchQuery) params.search = searchQuery
      if (roleFilter) params.role = roleFilter
      const res = await usersAPI.getAll(params)
      setUsers(res.data.users || [])
    } catch (err) {
      console.error('Fetch users error:', err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
      alert('Rol o\'zgartirildi!')
    } catch (err) {
      alert('Xatolik yuz berdi')
    }
  }

  const handleToggleActive = async (userId, isActive) => {
    try {
      await usersAPI.updateStatus(userId, !isActive)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !isActive } : u))
    } catch (err) {
      alert('Xatolik yuz berdi')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
          <p className="text-gray-600 text-sm">{users.length} foydalanuvchi</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Ism, telefon yoki email bo'yicha qidirish..."
              className="w-full pl-9 pr-3 py-2 bg-white text-gray-900 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Qidirish
          </button>
        </form>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
        >
          <option value="">Barcha rollar</option>
          {Object.entries(ROLE_LABELS).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Yuklanmoqda...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
            <Users size={48} className="text-gray-200" />
            <p>Foydalanuvchilar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Foydalanuvchi</th>
                  <th className="px-4 py-3 text-left">Telefon</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-center">Rol</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Ro'yxatdan o'tgan</th>
                  <th className="px-4 py-3 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => {
                  const roleInfo = ROLE_LABELS[user.role] || ROLE_LABELS.customer
                  const RoleIcon = roleInfo.icon
                  return (
                    <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/users/${user._id}`, { state: { user } })}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name || '—'}</p>
                            <p className="text-xs text-gray-500">ID: {user._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          {user.phone || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          {user.email || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={user.role}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); handleRoleChange(user._id, e.target.value) }}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${roleInfo.color}`}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, { label }]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(user._id, user.isActive) }}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                          {user.isActive ? 'Faol' : 'Nofaol'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
