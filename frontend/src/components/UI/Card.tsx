import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 ${className}`}>
      {children}
    </div>
  )
}
