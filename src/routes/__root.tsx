import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

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

function NavLink({ to, label }: { to: string; label: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to;
  return (
    <Link
      to={to}
      className={`relative px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {active && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />}
    </Link>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 backdrop-blur-md bg-background/70 sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-display text-xl">FC</div>
            <div>
              <div className="font-display text-xl leading-none">FC Sabbatår</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Holdets HQ</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" label="Statistik" />
            <NavLink to="/squad" label="Trup" />
            <NavLink to="/upcoming" label="Kommende kamp" />
            <NavLink to="/fixtures" label="Kampe" />
            <NavLink to="/bodekasse" label="Bødekasse" />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
