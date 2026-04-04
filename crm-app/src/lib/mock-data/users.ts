import { User } from '@/types/user'

export const mockUsers: User[] = [
  {
    id: 'usr_1',
    name: 'Arjun Sharma',
    email: 'arjun.sharma@synthoquest.com',
    phone: '+91 98765 43210',
    role: 'admin',
    department: 'training',
    status: 'active',
    joinDate: '2022-01-15T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    salary: 85000,
  },
  {
    id: 'usr_2',
    name: 'Priya Patel',
    email: 'priya.patel@synthoquest.com',
    phone: '+91 98765 43211',
    role: 'hr',
    department: 'training',
    status: 'active',
    joinDate: '2022-03-01T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    salary: 65000,
  },
  {
    id: 'usr_3',
    name: 'Vikram Singh',
    email: 'vikram.singh@synthoquest.com',
    phone: '+91 98765 43212',
    role: 'team_lead',
    department: 'sales',
    status: 'active',
    joinDate: '2022-06-15T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    salary: 70000,
  },
  {
    id: 'usr_4',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@synthoquest.com',
    phone: '+91 98765 43213',
    role: 'team_lead',
    department: 'training',
    status: 'active',
    joinDate: '2022-04-01T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya',
    salary: 72000,
  },
  {
    id: 'usr_5',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@synthoquest.com',
    phone: '+91 98765 43214',
    role: 'sales_rep',
    department: 'sales',
    status: 'active',
    joinDate: '2023-01-10T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    salary: 45000,
    managedBy: 'usr_3',
  },
  {
    id: 'usr_6',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@synthoquest.com',
    phone: '+91 98765 43215',
    role: 'sales_rep',
    department: 'sales',
    status: 'active',
    joinDate: '2023-02-15T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    salary: 48000,
    managedBy: 'usr_3',
  },
  {
    id: 'usr_7',
    name: 'Amit Verma',
    email: 'amit.verma@synthoquest.com',
    phone: '+91 98765 43216',
    role: 'employee',
    department: 'training',
    status: 'active',
    joinDate: '2023-03-01T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    salary: 52000,
    managedBy: 'usr_4',
  },
  {
    id: 'usr_8',
    name: 'Kavitha Nair',
    email: 'kavitha.nair@synthoquest.com',
    phone: '+91 98765 43217',
    role: 'employee',
    department: 'marketing',
    status: 'active',
    joinDate: '2023-04-10T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavitha',
    salary: 46000,
  },
  {
    id: 'usr_9',
    name: 'Sanjay Gupta',
    email: 'sanjay.gupta@synthoquest.com',
    phone: '+91 98765 43218',
    role: 'employee',
    department: 'training',
    status: 'active',
    joinDate: '2023-05-15T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay',
    salary: 50000,
    managedBy: 'usr_4',
  },
  {
    id: 'usr_10',
    name: 'Divya Krishnan',
    email: 'divya.krishnan@synthoquest.com',
    phone: '+91 98765 43219',
    role: 'sales_rep',
    department: 'sales',
    status: 'active',
    joinDate: '2023-06-01T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Divya',
    salary: 44000,
    managedBy: 'usr_3',
  },
  {
    id: 'usr_11',
    name: 'Manish Joshi',
    email: 'manish.joshi@synthoquest.com',
    phone: '+91 98765 43220',
    role: 'employee',
    department: 'marketing',
    status: 'active',
    joinDate: '2023-07-10T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manish',
    salary: 42000,
  },
  {
    id: 'usr_12',
    name: 'Pooja Menon',
    email: 'pooja.menon@synthoquest.com',
    phone: '+91 98765 43221',
    role: 'employee',
    department: 'training',
    status: 'active',
    joinDate: '2023-08-01T00:00:00Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pooja',
    salary: 48000,
    managedBy: 'usr_4',
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

export function getSalesReps(): User[] {
  return mockUsers.filter(user => user.role === 'sales_rep')
}
