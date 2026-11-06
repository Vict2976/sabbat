# Module: src/components

(part 1 of 2) Shared React UI layer for a Danish football-team app (season/fixture management): three domain components — fixture sign-up panel with a 48h-before-kickoff deadline (AttendancePanel), a month-grid match calendar (FixtureCalendar), and a season selector (SeasonPicker) — plus a shadcn/ui-style library of Radix-based primitives under src/components/ui that the rest of the app composes. (part 2 of 2) shadcn/ui-style presentational React component library (the `src/components/ui/*` slice shown) built on Radix UI primitives, class-variance-authority variants, and Tailwind class merging via `cn`. Provides layout and form primitives (sidebar shell with cookie-persisted open state and Cmd/Ctrl+B shortcut, tables, tabs, toggles, switch, slider, textarea, tooltip, skeleton) plus a themed Sonner toast host. No business logic, data fetching, or server code.

_This module does not fit in one model call, so it was read in 2 parts and their summaries were combined without a further model call._

## Key files
- `src/components/AttendancePanel.tsx`: Per-fixture attendance sign-up: reads/upserts/deletes rows in the Supabase `fixture_attendance` table directly from the browser, computes a sign-up deadline (kickoff − 48h), runs a 1s countdown, groups players into pending/yes/no columns, and locks edits after the deadline unless an admin is logged in (useAuth).
- `src/components/FixtureCalendar.tsx`: Monday-first month calendar that marks match days; each fixture renders as a TanStack Router Link to /fixtures/$fixtureId with win/loss/draw colouring based on our_score/their_score.
- `src/components/SeasonPicker.tsx`: Radix Select bound to SeasonContext (seasons, seasonId, setSeasonId, openNewSeasonDialog); the 'Ny sæson…' item requires login via AuthContext.openLoginDialog and shows a dashed placeholder when no seasons exist (migration hint).
- `src/components/ui/button.tsx`: Core Button + buttonVariants (cva) reused by alert-dialog, calendar, carousel, pagination.
- `src/components/ui/select.tsx`: Radix Select wrapper used by SeasonPicker.
- `src/components/ui/context-menu.tsx`: Radix ContextMenu wrapper used by AttendancePanel for right-click/long-press answer changes.
- `src/components/ui/dialog.tsx`: Radix Dialog wrapper; also the base for command.tsx (CommandDialog) and sheet.tsx.
- `src/components/ui/form.tsx`: react-hook-form integration (Form/FormField/FormItem/FormLabel/FormControl/FormMessage, useFormField).
- `src/components/ui/chart.tsx`: Recharts ChartContainer/ChartTooltipContent with per-theme CSS variable injection via ChartStyle.
- `src/components/ui/calendar.tsx`: react-day-picker wrapper (Calendar, CalendarDayButton) — distinct from the domain FixtureCalendar.
- `src/components/ui/sidebar.tsx`: Most complex component: SidebarProvider context (open/collapsed state, mobile Sheet fallback, cookie persistence under `sidebar_state`, keyboard shortcut), Sidebar container with side/variant/collapsible options, and useSidebar hook. Composes Button, Input, Separator, Sheet, Skeleton, Tooltip. File is truncated in the scan.
- `src/components/ui/table.tsx`: Styled HTML table primitives (Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption).
- `src/components/ui/tabs.tsx`: Radix Tabs wrappers (Tabs, TabsList, TabsTrigger, TabsContent).
- `src/components/ui/toggle.tsx`: Radix Toggle wrapper and the shared `toggleVariants` cva definition reused by toggle-group.
- `src/components/ui/toggle-group.tsx`: Radix ToggleGroup with a context that propagates variant/size to ToggleGroupItem.
- `src/components/ui/tooltip.tsx`: Radix Tooltip re-exports with styled portal content; TooltipProvider is consumed by sidebar.
- `src/components/ui/sonner.tsx`: Themed Toaster host wrapping the `sonner` library.
- `src/components/ui/switch.tsx`: Radix Switch wrapper.
- `src/components/ui/slider.tsx`: Radix Slider wrapper.
- `src/components/ui/textarea.tsx`: Styled native textarea.
- `src/components/ui/skeleton.tsx`: Pulse-animated placeholder div.

## Public interface
- AttendancePanel({ fixtureId, players, playedAt, kickoffTime })
- FixtureCalendar({ fixtures })
- SeasonPicker({ className? })
- ui/button: Button, buttonVariants, ButtonProps
- ui/select: Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectSeparator, SelectGroup, SelectLabel, SelectScrollUpButton, SelectScrollDownButton
- ui/context-menu: ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup
- ui/dialog: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose, DialogPortal, DialogOverlay
- ui/alert-dialog: AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogPortal, AlertDialogOverlay
- ui/form: Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField
- ui/card: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- ui/accordion: Accordion, AccordionItem, AccordionTrigger, AccordionContent
- ui/alert: Alert, AlertTitle, AlertDescription
- ui/avatar: Avatar, AvatarImage, AvatarFallback
- ui/badge: Badge, badgeVariants, BadgeProps
- ui/breadcrumb: Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis
- ui/calendar: Calendar, CalendarDayButton
- ui/carousel: Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselApi
- ui/chart: ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle, ChartConfig
- ui/checkbox: Checkbox
- ui/collapsible: Collapsible, CollapsibleTrigger, CollapsibleContent
- ui/command: Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator
- ui/drawer: Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose, DrawerPortal, DrawerOverlay
- ui/dropdown-menu: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator (export list truncated)
- ui/hover-card: HoverCard, HoverCardTrigger, HoverCardContent
- ui/input: Input
- ui/input-otp: InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator
- ui/label: Label
- ui/menubar: Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem, MenubarSub, MenubarSubTrigger, MenubarSubContent, MenubarGroup, MenubarPortal, MenubarRadioGroup (file truncated)
- ui/navigation-menu: NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport, navigationMenuTriggerStyle
- ui/pagination: Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis
- ui/popover: Popover, PopoverTrigger, PopoverContent, PopoverAnchor
- ui/progress: Progress
- ui/radio-group: RadioGroup, RadioGroupItem
- ui/resizable: ResizablePanelGroup, ResizablePanel, ResizableHandle
- ui/scroll-area: ScrollArea, ScrollBar
- ui/separator: Separator
- ui/sheet: Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetPortal, SheetOverlay
- ui/aspect-ratio: AspectRatio
- sidebar.tsx: SidebarProvider, Sidebar, useSidebar (export list truncated; additional Sidebar* subcomponents likely but not visible)
- skeleton.tsx: Skeleton
- slider.tsx: Slider
- sonner.tsx: Toaster
- switch.tsx: Switch
- table.tsx: Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption
- tabs.tsx: Tabs, TabsList, TabsTrigger, TabsContent
- textarea.tsx: Textarea
- toggle-group.tsx: ToggleGroup, ToggleGroupItem
- toggle.tsx: Toggle, toggleVariants
- tooltip.tsx: Tooltip, TooltipTrigger, TooltipContent, TooltipProvider

## Dependencies
- react
- @tanstack/react-router (Link in FixtureCalendar)
- @/integrations/supabase/client (AttendancePanel)
- @/contexts/AuthContext (useAuth)
- @/contexts/SeasonContext (useSeason)
- @/lib/utils (cn)
- sonner (toast)
- lucide-react
- @radix-ui/react-* (accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slot)
- class-variance-authority
- react-day-picker
- embla-carousel-react
- recharts
- cmdk
- vaul
- react-hook-form
- input-otp
- react-resizable-panels
- @radix-ui/react-slot
- @radix-ui/react-slider
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- sonner
- @/lib/utils (cn) — internal, not in provided files
- @/hooks/use-mobile (useIsMobile) — internal, not in provided files
- @/components/ui/button, @/components/ui/input, @/components/ui/separator, @/components/ui/sheet — sibling components imported by sidebar.tsx but not in provided files

## Open questions
- AttendancePanel performs Supabase reads/writes directly from the browser with no auth required for members; is the 48h deadline (and the admin override) also enforced server-side (RLS/trigger), or only in this client component?
- AttendancePanel calls load() without aborting on fixtureId change and re-fetches after every write; potential stale-response race under rapid toggling.
- The tail of AttendancePanel.tsx (SignupCountdown body, AttendanceColumn, PlayerRow, AnswerButton) is truncated — the context-menu/reset wiring could not be verified.
- src/components/ui/chart.tsx, dropdown-menu.tsx and menubar.tsx are truncated; full export lists are inferred from the visible portion.
- Several ui files carry a "use client" directive (Next.js/RSC convention); it is inert here but suggests boilerplate copied from a Next.js shadcn template.
- Both ui/calendar.tsx (react-day-picker) and FixtureCalendar.tsx exist; is the generic Calendar actually used anywhere, or is it dead shadcn boilerplate (as may be many of the ui primitives)?
- FixtureCalendar expects fixtures[0] to be the nearest match — who guarantees that ordering?
- src/components/ui/sidebar.tsx is truncated; the full export list (SidebarTrigger, SidebarMenu, SidebarInset, etc.) and the `sidebarMenuButtonVariants` cva usage implied by the Slot/cva/PanelLeft imports cannot be confirmed.
- SidebarProvider writes `document.cookie` for `sidebar_state`; nothing in these files reads it back on the server, so whether SSR hydrates `defaultOpen` from the cookie depends on a caller (e.g. a route) not shown.
- toggle-group.tsx and tooltip.tsx carry a `"use client"` directive, a React Server Components convention; it is inert boilerplate in this setup but suggests the components were copied from a Next.js-oriented shadcn template.
- The `@uxid` comment markers on every component imply a tooling/registry convention whose consumer is not visible here.
- Only the s–t alphabetical slice of src/components/ui is provided; the module likely contains many more primitives and possibly non-ui composite components.
