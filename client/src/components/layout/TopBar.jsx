import React from 'react'
import { ArrowLeft, ShoppingBag, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../store/cartStore'
import { IconButton } from '../ui'
import { cn } from '../../utils/format'

/* TopBar — red header used on Home + Catalog screens
   Variants:
   - 'home'     → brand logo + lang + cart
   - 'catalog'  → back + title + cart
   - 'plain'    → back + title (no cart) */
export function TopBar({ variant = 'home', title, onBack, children }) {
  const navigate = useNavigate()
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0))

  return (
    <div className="relative bg-primary-600 px-4 pt-safe pb-4 stripes">
      <div className="relative z-[1] flex items-center justify-between gap-3 mb-3 pt-2">
        {variant === 'home' ? (
          <div>
            <div className="font-display text-3xl tracking-wider text-white leading-none">MEATZONE</div>
            <div className="text-[11px] text-white/60 font-medium mt-0.5">Go'sht do'koni · Toshkent</div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <IconButton onClick={onBack || (() => navigate(-1))}>
              <ArrowLeft size={18} strokeWidth={2.4} className="text-white" />
            </IconButton>
            <div className="font-display text-2xl tracking-wide text-white truncate">{title}</div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {variant === 'home' && (
            <IconButton aria-label="Til">
              <span className="text-base">🇺🇿</span>
            </IconButton>
          )}
          {variant !== 'plain' && (
            <div className="relative">
              <IconButton onClick={() => navigate('/cart')} aria-label="Savat">
                <ShoppingBag size={17} strokeWidth={2} className="text-white" />
              </IconButton>
              {count > 0 && (
                <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-primary text-[9px] font-extrabold flex items-center justify-center">
                  {count}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  )
}

/* SearchBar inside TopBar */
export function SearchBar({ value, onChange, placeholder = "Mahsulot qidirish…", readOnly, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative z-[1] bg-black/28 border border-white/12 rounded-md flex items-center gap-2.5 px-3.5 h-11',
        readOnly && 'cursor-pointer'
      )}
    >
      <Search size={15} className="text-white/50 shrink-0" strokeWidth={2.2} />
      <input
        value={value || ''}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className="bg-transparent border-0 outline-0 text-white text-sm font-medium w-full placeholder:text-white/45"
      />
    </div>
  )
}
