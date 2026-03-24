import { User } from '@/types/user'

export const mockUsers: User[] = [
  {
    id: 'usr_1',
    name: 'Alex Johnson',
    email: 'alex@synthoquest.com',
    phone: '+91 98765 43210',
    role: 'admin',
    department: 'training',
    status: 'active',
    joinDate: new Date('2022-01-15'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    salary: 85000,
  },
  {
    id: 'usr_2',
    name: 'Sarah Williams',
    email: 'sarah@synthoquest.com',
    phone: '+91 98765 43211',
    role: 'hr',
    department: 'training',
    status: 'active',
    joinDate: new Date('2022-03-01'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    salary: 65000,
  },
  {
    id: 'usr_3',
    name: 'Michael Chen',
    email: 'michael@synthoquest.com',
    phone: '+91 98765 43212',
    role: 'team_lead',
    department: 'sales',
    status: 'active',
    joinDate: new Date('2022-06-15'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    salary: 70000,
  },
  {
    id: 'usr_4',
    name: 'Emily Davis',
    email: 'emily@synthoquest.com',
    phone: '+91 98765 43213',
    role: 'team_lead',
    department: 'training',
    status: 'active',
    joinDate: new Date('2022-04-01'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    salary: 72000,
  },
  {
    id: 'usr_5',
    name: 'James Wilson',
    email: 'james@synthoquest.com',
    phone: '+91 98765 43214',
    role: 'employee',
    department: 'sales',
    status: 'active',
    joinDate: new Date('2023-01-10'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    salary: 45000,
  },
  {
    id: 'usr_6',
    name: 'Lisa Anderson',
    email: 'lisa@synthoquest.com',
    phone: '+91 98765 43215',
    role: 'employee',
    department: 'sales',
    status: 'active',
    joinDate: new Date('2023-02-15'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    salary: 48000,
  },
  {
    id: 'usr_7',
    name: 'David Brown',
    email: 'david@synthoquest.com',
    phone: '+91 98765 43216',
    role: 'employee',
    department: 'training',
    status: 'active',
    joinDate: new Date('2023-03-01'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    salary: 52000,
  },
  {
    id: 'usr_8',
    name: 'Jennifer Taylor',
    email: 'jennifer@synthoquest.com',
    phone: '+91 98765 43217',
    role: 'employee',
    department: 'marketing',
    status: 'active',
    joinDate: new Date('2023-04-10'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer',
    salary: 46000,
  },
  {
    id: 'usr_9',
    name: 'Robert Martinez',
    email: 'robert@synthoquest.com',
    phone: '+91 98765 43218',
    role: 'employee',
    department: 'training',
    status: 'active',
    joinDate: new Date('2023-05-15'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    salary: 50000,
  },
  {
    id: 'usr_10',
    name: 'Amanda White',
    email: 'amanda@synthoquest.com',
    phone: '+91 98765 43219',
    role: 'employee',
    department: 'sales',
    status: 'active',
    joinDate: new Date('2023-06-01'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda',
    salary: 44000,
  },
  {
    id: 'usr_11',
    name: 'Chris Thompson',
    email: 'chris@synthoquest.com',
    phone: '+91 98765 43220',
    role: 'employee',
    department: 'marketing',
    status: 'active',
    joinDate: new Date('2023-07-10'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris',
    salary: 42000,
  },
  {
    id: 'usr_12',
    name: 'Nicole Garcia',
    email: 'nicole@synthoquest.com',
    phone: '+91 98765 43221',
    role: 'employee',
    department: 'training',
    status: 'active',
    joinDate: new Date('2023-08-01'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nicole',
    salary: 48000,
  },
]

export function getUserById(id: string): User | undefined {
  return mockUsers.find(user => user.id === id)
}

export function getUsersByDepartment(department: string): User[] {
  return mockUsers.filter(user => user.department === department)
}

export function getUsersByRole(role: string): User[] {
  return mockUsers.filter(user => user.role === role)
}

export function getTeamMembers(leadId: string): User[] {
  const lead = getUserById(leadId)
  if (!lead || lead.role !== 'team_lead') return []
  return mockUsers.filter(user => user.department === lead.department && user.role === 'employee')
}