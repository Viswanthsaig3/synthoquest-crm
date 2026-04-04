import { Task, TaskComment, TaskAttachment, TaskCompletion } from '@/types/task'
import { generateId } from '@/lib/utils'

const createComment = (taskId: string, userId: string, content: string): TaskComment => ({
  id: generateId(),
  taskId,
  userId,
  content,
  createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
})

const createAttachment = (fileName: string, fileSize: number, uploadedBy: string): TaskAttachment => ({
  id: generateId(),
  fileName,
  fileSize,
  uploadedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
  uploadedBy,
})

const createCompletion = (remarks: string, completedBy: string, attachmentNames: string[]): TaskCompletion => ({
  completedAt: new Date('2024-01-19'),
  completedBy,
  remarks,
  attachments: attachmentNames.map((name, i) => ({
    id: `att_${i}`,
    fileName: name,
    fileSize: Math.floor(Math.random() * 500000) + 50000,
    uploadedAt: new Date('2024-01-19'),
    uploadedBy: completedBy,
  })),
})

export const mockTasks: Task[] = [
  {
    id: 'task_1',
    title: 'Follow up with Rahul Sharma',
    description: 'Call to discuss Ethical Hacking course details and schedule',
    priority: 'high',
    status: 'todo',
    assignedTo: 'usr_5',
    createdBy: 'usr_3',
    deadline: new Date('2024-01-22'),
    comments: [],
    attachments: [],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'task_2',
    title: 'Prepare demo session for Cloud Security',
    description: 'Create a 30-minute demo covering cloud security fundamentals',
    priority: 'medium',
    status: 'in_progress',
    assignedTo: 'usr_7',
    createdBy: 'usr_4',
    deadline: new Date('2024-01-25'),
    comments: [
      createComment('task_2', 'usr_7', 'Started working on the presentation'),
      createComment('task_2', 'usr_4', 'Great! Make sure to include AWS security best practices'),
    ],
    attachments: [
      createAttachment('cloud-security-outline.pdf', 245000, 'usr_7'),
      createAttachment('demo-slides-draft.pptx', 1500000, 'usr_7'),
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'task_3',
    title: 'Update course curriculum',
    description: 'Add latest CEH v12 topics to the certification preparation course',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'usr_9',
    createdBy: 'usr_4',
    deadline: new Date('2024-01-28'),
    comments: [
      createComment('task_3', 'usr_9', 'Reviewing the changes required'),
    ],
    attachments: [
      createAttachment('ceh-v12-changes.docx', 89000, 'usr_9'),
    ],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'task_4',
    title: 'Social media campaign for new batch',
    description: 'Create and schedule posts for February batch announcement',
    priority: 'medium',
    status: 'todo',
    assignedTo: 'usr_8',
    createdBy: 'usr_1',
    deadline: new Date('2024-01-23'),
    comments: [],
    attachments: [],
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: 'task_5',
    title: 'Contact converted leads',
    description: 'Send welcome emails and batch details to recently converted leads',
    priority: 'high',
    status: 'done',
    assignedTo: 'usr_10',
    createdBy: 'usr_3',
    deadline: new Date('2024-01-19'),
    comments: [
      createComment('task_5', 'usr_10', 'All welcome emails sent successfully'),
      createComment('task_5', 'usr_3', 'Great work!'),
    ],
    attachments: [
      createAttachment('welcome-email-template.pdf', 45000, 'usr_10'),
    ],
    completion: createCompletion('Sent welcome emails to all 15 converted leads. Created email template for future use.', 'usr_10', ['welcome-email-template.pdf']),
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'task_6',
    title: 'Prepare lab environment',
    description: 'Set up virtual machines for the Ethical Hacking practical sessions',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'usr_12',
    createdBy: 'usr_4',
    deadline: new Date('2024-01-30'),
    comments: [
      createComment('task_6', 'usr_12', 'Setting up Kali Linux VMs'),
    ],
    attachments: [
      createAttachment('lab-setup-guide.pdf', 320000, 'usr_12'),
      createAttachment('vm-configurations.xlsx', 56000, 'usr_12'),
    ],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'task_7',
    title: 'Review lost leads report',
    description: 'Analyze reasons for lost leads and suggest improvements',
    priority: 'low',
    status: 'todo',
    assignedTo: 'usr_6',
    createdBy: 'usr_3',
    deadline: new Date('2024-01-26'),
    comments: [],
    attachments: [],
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'task_8',
    title: 'Create student feedback form',
    description: 'Design Google Form for collecting student feedback after course completion',
    priority: 'medium',
    status: 'done',
    assignedTo: 'usr_8',
    createdBy: 'usr_2',
    deadline: new Date('2024-01-18'),
    comments: [
      createComment('task_8', 'usr_8', 'Form created and shared with team'),
    ],
    attachments: [],
    completion: createCompletion('Created comprehensive feedback form with 15 questions covering course content, instructor quality, and lab facilities. Shared with HR and training team.', 'usr_8', []),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: 'task_9',
    title: 'Update website content',
    description: 'Add new course offerings and update pricing on website',
    priority: 'medium',
    status: 'todo',
    assignedTo: 'usr_11',
    createdBy: 'usr_1',
    deadline: new Date('2024-01-24'),
    comments: [],
    attachments: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'task_10',
    title: 'Prepare monthly report',
    description: 'Compile lead conversion and revenue data for January',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 'usr_5',
    createdBy: 'usr_3',
    deadline: new Date('2024-01-31'),
    comments: [
      createComment('task_10', 'usr_5', 'Gathering data from CRM'),
    ],
    attachments: [
      createAttachment('jan-data-export.xlsx', 125000, 'usr_5'),
    ],
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'task_11',
    title: 'Schedule webinar',
    description: 'Plan and schedule a free introductory webinar on Cyber Security',
    priority: 'medium',
    status: 'todo',
    assignedTo: 'usr_11',
    createdBy: 'usr_1',
    deadline: new Date('2024-02-05'),
    comments: [],
    attachments: [],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'task_12',
    title: 'Infrastructure security audit',
    description: 'Conduct security audit of internal systems and lab infrastructure',
    priority: 'high',
    status: 'todo',
    assignedTo: 'usr_7',
    createdBy: 'usr_1',
    deadline: new Date('2024-02-01'),
    comments: [],
    attachments: [],
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
]

export function getTasksByStatus(status: string): Task[] {
  return mockTasks.filter(task => task.status === status)
}

export function getTasksByAssignee(userId: string): Task[] {
  return mockTasks.filter(task => task.assignedTo === userId)
}

export function getTaskById(id: string): Task | undefined {
  return mockTasks.find(task => task.id === id)
}

export function getTasksByDepartment(department: string): Task[] {
  const departmentUsers = department === 'sales' 
    ? ['usr_5', 'usr_6', 'usr_10'] 
    : department === 'training' 
    ? ['usr_7', 'usr_9', 'usr_12']
    : ['usr_8', 'usr_11']
  
  return mockTasks.filter(task => departmentUsers.includes(task.assignedTo))
}