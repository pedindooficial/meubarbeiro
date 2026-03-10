"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const navItems = [
  { href: "/admin", label: "Visão geral", icon: "📊" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-white/5"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
        <Link href="/admin" className="font-bold text-white">Meu Barbeiro · Admin</Link>
        <span className="w-10" />
      </header>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col pt-14 lg:pt-0 transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-zinc-800 shrink-0">
          <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">Meu Barbeiro</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Admin
            </span>
          </Link>
        </div>
        <nav className="p-3 flex-1 flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon }) => {
            const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base" aria-hidden>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-800 space-y-1">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            Ir ao app
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-left"
          >
            Sair
          </button>
        </div>
      </aside>
      <div className="hidden lg:flex fixed top-0 left-64 right-0 z-30 h-14 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur items-center justify-between px-6 shrink-0">
        <p className="text-sm text-zinc-500">Painel de administração</p>
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Atualizar
          </a>
        </div>
      </div>
    </>
  );
}
