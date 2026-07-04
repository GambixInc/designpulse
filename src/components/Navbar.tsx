import Link from "next/link";
import { getSessionProfile } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export default async function Navbar() {
  const { profile } = await getSessionProfile();
  return (
    <nav className="sticky top-0 z-40 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-pulse-400 to-fuchsia-500" />
          DesignPulse
        </Link>
        <div className="hidden md:flex items-center gap-5 text-sm text-slate-400">
          <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
          <Link href="/marketplace?platform=wix_studio" className="hover:text-white">Wix Studio</Link>
          <Link href="/marketplace?platform=webflow" className="hover:text-white">Webflow</Link>
          <Link href="/marketplace?platform=wordpress" className="hover:text-white">WordPress</Link>
          <Link href="/marketplace?platform=shopify" className="hover:text-white">Shopify</Link>
          <Link href="/marketplace?platform=ghl" className="hover:text-white">GHL</Link>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {profile ? (
            <>
              {profile.role === "admin" && (
                <Link href="/admin" className="btn-ghost">Admin</Link>
              )}
              {(profile.role === "seller" || profile.role === "admin") ? (
                <Link href="/sell/dashboard" className="btn-ghost">Seller hub</Link>
              ) : (
                <Link href="/sell" className="btn-ghost">Become a seller</Link>
              )}
              <Link href="/dashboard" className="btn-primary">My library</Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sell" className="text-slate-400 hover:text-white">Sell on DesignPulse</Link>
              <Link href="/login" className="btn-primary">Sign in</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
