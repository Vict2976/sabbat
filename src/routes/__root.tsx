import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { Home, Trophy, Users, CalendarDays, Coins, LogIn, LogOut } from "lucide-react";
import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">Uden for banen.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Tilbage til forsiden</Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "FC Sabbatår" },
      { name: "description", content: "Trup, statistik og bødekasse for FC Sabbatår." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Kamp", icon: Home },
  { to: "/stats", label: "Stats", icon: Trophy },
  { to: "/squad", label: "Trup", icon: Users },
  { to: "/fixtures", label: "Kampe", icon: CalendarDays },
  { to: "/bodekasse", label: "Bøder", icon: Coins },
] as const;

function DesktopNavLink({ to, label }: { to: string; label: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to || (to !== "/" && path.startsWith(to));
  return (
    <Link
      to={to}
      className={`relative px-3 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {active && <span className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-primary" />}
    </Link>
  );
}

function BottomTab({ to, label, Icon }: { to: string; label: string; Icon: React.ComponentType<{ className?: string }> }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to || (to !== "/" && path.startsWith(to));
  return (
    <Link
      to={to}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
    </Link>
  );
}

function AuthButton() {
  const { user, signOut, openLoginDialog } = useAuth();
  if (user) {
    return (
      <button
        onClick={signOut}
        title="Log ud"
        className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }
  return (
    <button
      onClick={openLoginDialog}
      title="Log ind"
      className="p-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
    >
      <LogIn className="h-4 w-4" />
    </button>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        {/* Desktop header */}
        <header className="border-b border-border/50 backdrop-blur-md bg-background/70 sticky top-0 z-40 hidden md:block">
          <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-display text-xl">FC</div>
              <div>
                <div className="font-display text-xl leading-none">FC Sabbatår</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Holdets HQ</div>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label }) => (
                <DesktopNavLink key={to} to={to} label={label} />
              ))}
              <AuthButton />
            </nav>
          </div>
        </header>

        {/* Mobile top bar — logo + auth button */}
        <header className="border-b border-border/50 backdrop-blur-md bg-background/70 sticky top-0 z-40 flex md:hidden items-center justify-between h-12 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-display text-base">FC</div>
            <div className="font-display text-lg leading-none">FC Sabbatår</div>
          </Link>
          <AuthButton />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md flex md:hidden safe-area-inset-bottom">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <BottomTab key={to} to={to} label={label} Icon={Icon} />
          ))}
        </nav>

        <Toaster />
      </div>
    </AuthProvider>
  );
}
