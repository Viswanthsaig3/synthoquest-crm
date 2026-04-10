// Role configuration - can be customized or moved to database
export const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    hexBg: '#fef2f2',
    hexBorder: '#dc2626',
    hexText: '#991b1b',
  },
  hr: {
    label: 'HR',
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    hexBg: '#faf5ff',
    hexBorder: '#9333ea',
    hexText: '#6b21a8',
  },
  team_lead: {
    label: 'Team Lead',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    hexBg: '#eff6ff',
    hexBorder: '#2563eb',
    hexText: '#1d4ed8',
  },
  sales_rep: {
    label: 'Sales Rep',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    hexBg: '#f0fdf4',
    hexBorder: '#16a34a',
    hexText: '#15803d',
  },
  employee: {
    label: 'Employee',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    hexBg: '#f8fafc',
    hexBorder: '#64748b',
    hexText: '#475569',
  },
  intern: {
    label: 'Intern',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    hexBg: '#fff7ed',
    hexBorder: '#f97316',
    hexText: '#c2410c',
  },
} as const

export type RoleKey = keyof typeof ROLE_CONFIG

export function getRoleConfig(role: string) {
  return ROLE_CONFIG[role as RoleKey] || ROLE_CONFIG.employee
}

// Avatar configuration
export const AVATAR_CONFIG = {
  service: 'dicebear',
  style: 'avataaars',
  size: 128,
  getUrl: (name: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
}

// Layout configuration
export const HIERARCHY_LAYOUT = {
  indentSize: 40,
  nodeGap: 12,
  cardPadding: 12,
  avatarSize: 48,
  maxDepth: 10,
}

// Animation configuration
export const ANIMATION_CONFIG = {
  duration: 200,
  easing: 'ease-out',
}