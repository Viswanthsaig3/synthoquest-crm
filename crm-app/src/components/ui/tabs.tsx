import * as React from 'react'
import { cn } from '@/lib/utils'

type TabsCtx = {
  value: string
  setValue: (v: string) => void
}

const TabsContext = React.createContext<TabsCtx | null>(null)

function useTabsContext(component: string): TabsCtx {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error(`${component} must be used within <Tabs>`)
  return ctx
}

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue = '', value: valueProp, onValueChange, children, ...props }, ref) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp : uncontrolled
    const setValue = React.useCallback(
      (v: string) => {
        onValueChange?.(v)
        if (!isControlled) setUncontrolled(v)
      },
      [onValueChange, isControlled]
    )

    const ctx = React.useMemo(() => ({ value, setValue }), [value, setValue])

    return (
      <TabsContext.Provider value={ctx}>
        <div ref={ref} className={cn('', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = 'Tabs'

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
TabsList.displayName = 'TabsList'

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value: tabValue, type = 'button', ...props }, ref) => {
    const { value, setValue } = useTabsContext('TabsTrigger')
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          value === tabValue && 'bg-background text-foreground shadow-sm',
          className
        )}
        onClick={() => setValue(tabValue)}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value: contentValue, ...props }, ref) => {
    const { value } = useTabsContext('TabsContent')
    if (value !== contentValue) return null
    return (
      <div
        ref={ref}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      />
    )
  }
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
