"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  IconHome,
  IconUsers,
  IconScissors,
  IconCatalog,
  IconFinance,
  IconClipboard,
  IconCalendar,
  IconSubscription,
  IconLogout,
  IconUser,
  IconSettings,
  IconChevronDown,
} from "./DashboardIcons";

const links = [
  { href: "/dashboard", label: "Início", icon: IconHome },
  { href: "/dashboard/agendamentos", label: "Agendamentos", icon: IconCalendar },
  { href: "/dashboard/clientes", label: "Clientes", icon: IconUsers },
  { href: "/dashboard/cortes", label: "Cortes", icon: IconScissors },
  { href: "/dashboard/portfolio", label: "Portfólio", icon: IconCatalog },
  { href: "/dashboard/financeiro", label: "Financeiro", icon: IconFinance },
  { href: "/dashboard/planos-de-acao", label: "Planos de ação", icon: IconClipboard },
  { href: "/dashboard/planos", label: "Assinatura", icon: IconSubscription },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg border border-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
        <Link href="/dashboard" className="font-bold">
          Barbeiro
        </Link>
        <span className="w-10" />
      </header>
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-gray-800 transform transition-transform duration-200 ease-out
        md:translate-x-0 md:flex md:flex-col flex-col overflow-y-auto
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-4 border-b border-gray-800 hidden md:block shrink-0">
          <Link href="/dashboard" className="font-bold text-lg">
            Barbeiro
          </Link>
        </div>
        <nav className="p-4 flex-1 flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-lg min-h-[44px] flex items-center gap-3 ${
                pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800" ref={menuRef}>
          <div className="rounded-xl border border-gray-700 bg-white/[0.03] overflow-hidden">
            <button
              type="button"
              onClick={() => setMenuExpanded(!menuExpanded)}
              className="w-full px-4 py-3 min-h-[44px] flex items-center justify-between gap-2 text-gray-300 hover:bg-white/5 transition-colors"
              aria-expanded={menuExpanded}
              aria-haspopup="true"
            >
              <span className="flex items-center gap-3">
                <IconUser className="w-5 h-5 shrink-0 text-gray-400" />
                Conta
              </span>
              <IconChevronDown
                className={`w-5 h-5 shrink-0 text-gray-500 transition-transform ${menuExpanded ? "rotate-180" : ""}`}
              />
            </button>
            {menuExpanded && (
              <div className="border-t border-gray-700 py-1">
                <Link
                  href="/dashboard/conta"
                  onClick={() => { setMenuExpanded(false); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white min-h-[44px]"
                >
                  <IconUser className="w-5 h-5 shrink-0" />
                  Conta
                </Link>
                <Link
                  href="/dashboard/configuracoes"
                  onClick={() => { setMenuExpanded(false); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white min-h-[44px]"
                >
                  <IconSettings className="w-5 h-5 shrink-0" />
                  Configurações
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-red-400 min-h-[44px] text-left"
                >
                  <IconLogout className="w-5 h-5 shrink-0" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
