import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/format'
import { useToastStore } from '../../store/toastStore'

/* ──────────────────────────── Button ──────────────────────────── */
export function Button({ as: Tag = 'button', variant = 'primary', size = 'md', className, children, ...rest }) {
  const variants = {
    primary: 'bg-primary hover:bg-primary-600 active:bg-primary-700 text-white shadow-pop',
    ghost:   'bg-bg-surface2 hover:bg-bg-surface3 text-ink border border-ink-line',
    glass:   'bg-black/30 hover:bg-black/45 text-white border border-white/10 backdrop-blur',
    amber:   'bg-amber hover:bg-amber-600 text-white shadow-pop',
    danger:  'bg-danger hover:bg-primary-700 text-white',
  }
  const sizes = {
    sm: 'h-9 px-4 text-xs',
    md: 'h-12 px-5 text-sm',
    lg: 'h-14 px-6 text-base',
  }
  return (
    <Tag
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-bold transition-colors tap select-none disabled:opacity-50',
        variants[variant], sizes[size], className
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ──────────────────────────── IconButton ──────────────────────────── */
export function IconButton({ className, children, tone = 'glass', ...rest }) {
  const tones = {
    glass:  'bg-black/22 hover:bg-black/35 border border-white/10 text-white',
    surface:'bg-bg-surface2 hover:bg-bg-surface3 border border-ink-line text-ink',
    primary:'bg-primary hover:bg-primary-600 text-white',
  }
  return (
    <button
      className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center tap shrink-0',
        tones[tone], className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ──────────────────────────── Chip ──────────────────────────── */
export function Chip({ active, children, ...rest }) {
  return (
    <button
      className={cn(
        'shrink-0 px-4 h-9 rounded-full text-xs font-bold whitespace-nowrap transition-colors border tap',
        active
          ? 'bg-primary/10 text-ink border-primary/30'
          : 'bg-bg-surface text-ink-dim border-ink-line hover:text-ink'
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ──────────────────────────── Badge ──────────────────────────── */
export function Badge({ tone = 'red', children, className }) {
  const tones = {
    red:   'bg-primary text-white',
    green: 'bg-success text-white',
    amber: 'bg-amber text-white',
    dark:  'bg-black/50 text-white',
  }
  return (
    <span className={cn('inline-flex items-center px-2 h-5 rounded-md text-[10px] font-bold tracking-wide', tones[tone], className)}>
      {children}
    </span>
  )
}

/* ──────────────────────────── Stepper ──────────────────────────── */
export function Stepper({ value, onChange, min = 1, max = 99 }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  return (
    <div className="inline-flex items-center gap-2">
      <button onClick={dec} className="w-8 h-8 rounded-md bg-bg-surface3 border border-ink-line text-ink text-lg leading-none tap">−</button>
      <span className="min-w-[20px] text-center font-bold text-sm tabular">{value}</span>
      <button onClick={inc} className="w-8 h-8 rounded-md bg-bg-surface3 border border-ink-line text-ink text-lg leading-none tap">+</button>
    </div>
  )
}

/* ──────────────────────────── Skeleton ──────────────────────────── */
export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

/* ──────────────────────────── Section header ──────────────────────────── */
export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-baseline justify-between px-4 pt-6 pb-3">
      <h2 className="font-display text-2xl tracking-wide text-ink">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5 tap">
          {action}
        </button>
      )}
    </div>
  )
}

/* ──────────────────────────── Empty state ──────────────────────────── */
export function EmptyState({ icon = '🔍', title, sub, action }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="text-5xl mb-3 opacity-70">{icon}</div>
      <div className="font-display text-2xl tracking-wide text-ink mb-1">{title}</div>
      {sub && <div className="text-sm text-ink-dim mb-5">{sub}</div>}
      {action}
    </div>
  )
}

/* ──────────────────────────── Toast ──────────────────────────── */
export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  return (
    <div className="fixed bottom-[80px] inset-x-0 z-[200] flex flex-col items-center gap-2 pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 40, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="flex items-center gap-3 bg-white border-2 border-green-500 rounded-2xl px-4 py-3 shadow-xl w-full max-w-[360px]"
          >
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0 text-xl">
              {t.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-gray-900 truncate">{t.message}</div>
              <div className="text-[11px] text-green-600 font-semibold mt-0.5">✓ Savatga qo'shildi</div>
            </div>
            <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ──────────────────────────── Page transition wrapper ──────────────────────────── */
export function Page({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn('min-h-[100dvh] flex flex-col', className)}
    >
      {children}
    </motion.div>
  )
}
