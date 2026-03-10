"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const iconClass = "w-5 h-5 shrink-0";

function IconChart({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconExternal({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function IconLogout({ className = iconClass }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function IconMenu({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const navItems = [
  { href: "/admin", label: "Visão geral", icon: IconChart },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 min-h-[44px] border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 safe-area-inset-top">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg border border-zinc-700 text-zinc-300 hover:bg-white/5 hover:text-white flex items-center justify-center transition-colors"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="font-bold text-white text-base truncate max-w-[60vw]"
        >
          Meu Barbeiro
        </Link>
        <span className="w-[44px]" aria-hidden />
      </header>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[280px] max-w-[85vw] lg:max-w-none lg:w-64
          bg-zinc-950 border-r border-zinc-800 flex flex-col
          pt-14 lg:pt-0
          transition-transform duration-200 ease-out
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Logo / brand */}
          <div className="p-4 lg:p-5 border-b border-zinc-800 shrink-0">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5"
            >
              <span className="text-lg lg:text-xl font-bold tracking-tight text-white truncate">
                Meu Barbeiro
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                Admin
              </span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="p-3 flex-1 flex flex-col gap-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium min-h-[44px]
                    transition-colors
                    ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}
                  `}
                >
                  <Icon className={iconClass} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Footer links */}
          <div className="p-3 border-t border-zinc-800 space-y-0.5 shrink-0">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors min-h-[44px]"
            >
              <IconExternal className={iconClass} />
              Ir ao app
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-left min-h-[44px]"
            >
              <IconLogout className={iconClass} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
