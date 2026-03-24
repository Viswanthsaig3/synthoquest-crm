# SynthoQuest CRM

A comprehensive CRM (Customer Relationship Management) system designed for Cyber Security Institutes. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** - Overview of key metrics and recent activities
- **Employee Management** - Add, view, and manage employee records
- **Lead Management** - Track and manage potential customers
- **Task Management** - Create, assign, and track tasks
- **Attendance Tracking** - Monitor employee attendance with check-in/check-out
- **Leave Management** - Apply and approve leave requests
- **Timesheets** - Submit and approve timesheets
- **Payroll** - View payroll information and salary slips

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18.17 or later) - [Download Node.js](https://nodejs.org/)
- **npm** (v9.0 or later) - Comes with Node.js
- **Git** - [Download Git](https://git-scm.com/)

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/Viswanthsaig3/synthoquest-crm.git
cd synthoquest-crm/crm-app
```

2. **Install dependencies**

```bash
npm install
```

## Running the Application

### Development Mode

Run the development server with hot-reload:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Linting

Run ESLint to check for code issues:

```bash
npm run lint
```

## Project Structure

```
crm-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication routes
│   │   │   └── login/          # Login page
│   │   ├── (dashboard)/        # Dashboard routes
│   │   │   ├── attendance/     # Attendance management
│   │   │   ├── employees/      # Employee management
│   │   │   ├── leads/          # Lead management
│   │   │   ├── leaves/         # Leave management
│   │   │   ├── payroll/        # Payroll management
│   │   │   ├── settings/       # Application settings
│   │   │   ├── tasks/          # Task management
│   │   │   └── timesheets/     # Timesheet management
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── layout/             # Layout components (Header, Sidebar)
│   │   ├── shared/             # Shared/reusable components
│   │   └── ui/                 # UI components (Button, Card, etc.)
│   ├── context/
│   │   └── auth-context.tsx    # Authentication context
│   ├── lib/
│   │   ├── constants.ts        # Application constants
│   │   ├── mock-data/          # Mock data for development
│   │   └── utils.ts            # Utility functions
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) - React framework for production
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: Custom components built with [Radix UI](https://www.radix-ui.com/) primitives
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Charts**: [Recharts](https://recharts.org/) - Charting library for React
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful & consistent icons
- **Date Handling**: [date-fns](https://date-fns.org/) - Modern date utility library

## Environment Variables

Create a `.env.local` file in the root directory for any environment variables:

```env
# Add your environment variables here
# Example:
# DATABASE_URL=your_database_url
# API_KEY=your_api_key
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Default Login

For testing purposes, the application uses mock authentication. You can log in with any credentials on the login page.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For support or questions, please contact the development team.