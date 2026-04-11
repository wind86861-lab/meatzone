import { useEffect, useState } from 'react'
import { analyticsAPI } from '../services/api'
import {
  Users,
  DollarSign,
  Calendar,
  Wrench,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsAPI.getDashboard()
      setData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Customers',
      value: data?.summary?.totalCustomers || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Monthly Revenue',
      value: `$${(data?.summary?.monthlyRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: "Today's Appointments",
      value: data?.summary?.todayAppointments || 0,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      name: 'Pending Services',
      value: data?.summary?.pendingServices || 0,
      icon: Wrench,
      color: 'bg-orange-500',
    },
    {
      name: 'Low Stock Items',
      value: data?.summary?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      name: 'Total Revenue',
      value: `$${(data?.summary?.totalRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-blue-600',
    },
  ]

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const revenueData = data?.revenueByMonth?.map(item => ({
    month: monthNames[item._id - 1],
    revenue: item.revenue,
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Services</h2>
          <div className="space-y-3">
            {data?.recentServices?.length > 0 ? (
              data.recentServices.map((service) => (
                <div key={service._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {service.customer?.firstName} {service.customer?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{service.serviceType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${service.totalCost}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${service.status === 'completed' ? 'bg-green-100 text-green-700' :
                        service.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                      }`}>
                      {service.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent services</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
