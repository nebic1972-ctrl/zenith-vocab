import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  gradient?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'indigo' | 'pink'
}

const gradientClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  amber: 'from-amber-500 to-amber-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600',
  indigo: 'from-indigo-500 to-indigo-600',
  pink: 'from-pink-500 to-pink-600',
} as const

export default function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  gradient = 'blue',
}: MetricCardProps) {
  const gradientClass = gradientClasses[gradient] ?? gradientClasses.blue

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradientClass} p-6 text-white shadow-lg transition-shadow hover:shadow-xl`}>
      <div className="mb-3 flex items-center justify-between">
        <Icon size={24} />
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <p className="text-3xl font-bold leading-tight">{value}</p>
      {subtitle ? <p className="mt-1 text-sm opacity-80">{subtitle}</p> : null}
    </div>
  )
}
