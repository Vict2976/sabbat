# Guidelines

Conventions backed by **≥2** real, verbatim code examples. Anything with fewer is omitted below.

## When wrapping a Radix primitive that needs no styling, alias the primitive's Root/Trigger directly to a const with the shadcn component name instead of writing a wrapper component.

- `src/components/ui/accordion.tsx`:

  ```
  const Accordion = AccordionPrimitive.Root;
  ```

- `src/components/ui/alert-dialog.tsx`:

  ```
  const AlertDialog = AlertDialogPrimitive.Root;
  ```

- `src/components/ui/alert-dialog.tsx`:

  ```
  const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
  ```

- `src/components/ui/aspect-ratio.tsx`:

  ```
  const AspectRatio = AspectRatioPrimitive.Root;
  ```

- `src/components/ui/collapsible.tsx`:

  ```
  const Collapsible = CollapsiblePrimitive.Root;
  ```

- `src/components/ui/collapsible.tsx`:

  ```
  const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
  ```

## Styled UI primitives are implemented with React.forwardRef, typed against the underlying element or Radix component props, so refs and native attributes pass through.

- `src/components/ui/accordion.tsx`:

  ```
  const AccordionItem = React.forwardRef<
  ```

- `src/components/ui/alert.tsx`:

  ```
  const Alert = React.forwardRef<
  ```

- `src/components/ui/avatar.tsx`:

  ```
  const Avatar = React.forwardRef<
  ```

- `src/components/ui/avatar.tsx`:

  ```
  const AvatarImage = React.forwardRef<
  ```

- `src/components/ui/breadcrumb.tsx`:

  ```
  const Breadcrumb = React.forwardRef<
  ```

- `src/components/ui/breadcrumb.tsx`:

  ```
  const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ```

- `src/components/ui/card.tsx`:

  ```
  const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ```

- `src/components/ui/card.tsx`:

  ```
  const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ```

- `src/components/ui/checkbox.tsx`:

  ```
  const Checkbox = React.forwardRef<
  ```

## Define visual variants with class-variance-authority in a module-level const named `<component>Variants`, and export it alongside the component so other primitives can reuse it.

- `src/components/ui/alert.tsx`:

  ```
  const alertVariants = cva(
  ```

- `src/components/ui/badge.tsx`:

  ```
  const badgeVariants = cva(
  ```

- `src/components/ui/button.tsx`:

  ```
  const buttonVariants = cva(
  ```

## Export a dedicated `<Component>Props` interface that extends the native element attributes and the cva VariantProps.

- `src/components/ui/badge.tsx`:

  ```
  export interface BadgeProps
  ```

- `src/components/ui/button.tsx`:

  ```
  export interface ButtonProps
  ```

## UI primitive files use a trailing named `export { ... }` block rather than inline exports, keeping the export surface in one place.

- `src/components/ui/aspect-ratio.tsx`:

  ```
  export { AspectRatio };
  ```

- `src/components/ui/checkbox.tsx`:

  ```
  export { Checkbox };
  ```

## Hoist magic strings, sentinel values and lookup tables to UPPER_SNAKE_CASE module-level constants instead of inlining them in JSX or handlers.

- `src/components/FixtureCalendar.tsx`:

  ```
  const WEEKDAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
  ```

- `src/components/SeasonPicker.tsx`:

  ```
  const NEW_SEASON = "__new_season__";
  ```

- `src/components/ui/chart.tsx`:

  ```
  const THEMES = { light: "", dark: ".dark" } as const;
  ```

## Declare local `type` aliases for domain shapes and string-literal unions at the top of the component file rather than importing broad Database row types or using inline object types in props.

- `src/components/AttendancePanel.tsx`:

  ```
  type Player = { id: string; name: string };
  ```

- `src/components/AttendancePanel.tsx`:

  ```
  type Status = "yes" | "no";
  ```

- `src/components/FixtureCalendar.tsx`:

  ```
  type CalendarFixture = {
  ```

- `src/components/ui/carousel.tsx`:

  ```
  type CarouselApi = UseEmblaCarouselType[1];
  ```

- `src/components/ui/carousel.tsx`:

  ```
  type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
  ```

- `src/components/ui/chart.tsx`:

  ```
  export type ChartConfig = {
  ```

## Domain and non-forwardRef components are written as named `function` declarations with inline destructured, explicitly typed props.

- `src/router.tsx`:

  ```
  function DefaultErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  ```

- `src/components/SeasonPicker.tsx`:

  ```
  export function SeasonPicker({ className }: { className?: string }) {
  ```

- `src/components/ui/calendar.tsx`:

  ```
  function Calendar({
  ```

## Tooling config files default-export the result of the tool's config helper (defineConfig / tseslint.config) rather than a plain object.

- `eslint.config.js`:

  ```
  export default tseslint.config(
  ```

- `vite.config.ts`:

  ```
  export default defineConfig({
  ```

## Keep the hosting adapter isolated in api/ as a single default-exported async handler that reconstructs the request from forwarded headers; do not put business logic there — route it to the TanStack Start server's fetch handler.

- `api/ssr.js`:

  ```
  export default async function handler(req, res) {
  ```

- `api/ssr.js`:

  ```
  const protocol = req.headers["x-forwarded-proto"] || "https";
  ```

## Access the TanStack router inside components via the useRouter hook (e.g. for invalidate/reset in error boundaries) rather than importing the router instance directly.

- `src/router.tsx`:

  ```
  function DefaultErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  ```

- `src/router.tsx`:

  ```
  const router = useRouter();
  ```
