import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, ShoppingBag, ClipboardList, User } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { cn } from '../../utils/format'

const TABS = [
  { path: '/',           label: 'Asosiy',   icon: Home },
  { path: '/catalog',    label: 'Katalog',  icon: Search },
  { path: '/orders',     label: 'Buyurtma', icon: ClipboardList },
  { path: '/profile',    label: 'Profil',   icon: User },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0))

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-bg-surface/90 backdrop-blur-lg border-t border-ink-line pb-safe">
      <div className="max-w-[480px] mx-auto flex items-center justify-around h-14 px-1">
        {TABS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 h-full tap transition-colors',
                active ? 'text-primary' : 'text-ink-dim hover:text-ink'
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                {path === '/catalog' && count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] rounded-full bg-primary text-white text-[9px] font-extrabold flex items-center justify-center px-0.5">
                    {count}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium leading-none', active && 'font-bold')}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
