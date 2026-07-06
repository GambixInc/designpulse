import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";
import ThemeToggle from "./ThemeToggle";

export default async function Navbar() {
  const { profile } = await getSessionProfile();
  const role = profile?.role;
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-ink">
          <span className="inline-block h-6 w-6 rounded-md bg-accent" />
          DesignPulse
        </Link>
        <div className="hidden md:flex items-center gap-5 text-sm text-muted">
          <Link href="/marketplace" className="hover:text-ink">Templates</Link>
          <span className="inline-flex items-center gap-1.5 text-faint cursor-default">
            Plugins
            <span className="badge border-line text-faint text-[10px]">Soon</span>
          </span>
          <Link href="/marketplace?platform=ghl" className="hover:text-ink">GHL Assets</Link>
          <Link href="/licenses" className="hover:text-ink">Licenses</Link>
          <Link href="/sell" className="hover:text-ink">Sell on DesignPulse</Link>
        </div>
        <div className="ml-auto flex items-center gap-2.5 text-sm">
          <Link
            href="/marketplace"
            aria-label="Search templates"
            className="h-9 w-9 grid place-items-center rounded-full border border-line text-muted hover:text-ink hover:border-faint transition-colors"
          >
            ⌕
          </Link>
          <ThemeToggle />
          {profile ? (
            <>
              {role === "admin" && (
                <Link href="/admin" className="btn-ghost">Admin</Link>
              )}
              {(role === "admin" || role === "reviewer") && (
                <Link href="/review" className="btn-ghost">Review desk</Link>
              )}
              {role === "seller" ? (
                <Link href="/sell/dashboard" className="btn-ghost">Seller hub</Link>
              ) : role === "buyer" ? (
                <Link href="/sell" className="btn-ghost">Become a seller</Link>
              ) : null}
              <Link href="/dashboard" className="btn-primary">My library</Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className="btn-primary">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
