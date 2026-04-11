import { useState, useEffect } from 'react'
import { Bell, X, Check, CheckCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function NotificationBell() {
  const { user, token } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    if (!token) {
      console.log('[NotificationBell] No token available')
      return
    }

    try {
      console.log('[NotificationBell] Fetching notifications...')
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[NotificationBell] Received notifications:', data.length)
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.isRead).length)
      } else {
        console.error('[NotificationBell] Failed to fetch notifications:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('[NotificationBell] Error fetching notifications:', error)
    }
  }

  const fetchUnreadCount = async () => {
    if (!token) return

    try {
      const res = await fetch('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        console.log('[NotificationBell] Unread count:', data.count)
        setUnreadCount(data.count)
      } else {
        console.error('[NotificationBell] Failed to fetch unread count:', res.status)
      }
    } catch (error) {
      console.error('[NotificationBell] Error fetching unread count:', error)
    }
  }

  const markAsRead = async (notificationId) => {
    if (!token) return

    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!token) return
    setLoading(true)

    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (notificationId) => {
    if (!token) return

    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
        const wasUnread = notifications.find(n => n._id === notificationId)?.isRead === false
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount()
      const interval = setInterval(fetchUnreadCount, 30000) // Poll every 30 seconds
      return () => clearInterval(interval)
    }
  }, [user, token])

  useEffect(() => {
    if (isOpen && token) {
      fetchNotifications()
    }
  }, [isOpen, token])

  if (!user) return null

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'role_change':
        return '👤'
      case 'order_update':
        return '📦'
      case 'appointment':
        return '📅'
      default:
        return '🔔'
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffMs = now - notifDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} д назад`
    return notifDate.toLocaleDateString('ru-RU')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-primary-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-dark-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-dark-100 z-50 max-h-[600px] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-dark-100">
              <h3 className="font-bold text-dark-900">Уведомления</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs text-primary hover:text-primary-600 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Прочитать все
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-dark-50 rounded-lg transition-colors"
                >
                  <X size={18} className="text-dark-400" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-dark-400">
                  <Bell size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Нет уведомлений</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-light-50 transition-colors ${!notification.isRead ? 'bg-primary-50/30' : ''
                        }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-dark-900">
                              {notification.title}
                            </h4>
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="p-1 hover:bg-dark-100 rounded transition-colors flex-shrink-0"
                            >
                              <X size={14} className="text-dark-400" />
                            </button>
                          </div>
                          <p className="text-sm text-dark-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-dark-400">
                              {formatTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification._id)}
                                className="text-xs text-primary hover:text-primary-600 font-semibold flex items-center gap-1"
                              >
                                <Check size={12} />
                                Прочитано
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
