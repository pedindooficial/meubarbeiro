"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconCalendar, IconUsers, IconScissors } from "./DashboardIcons";

const navItems = [
  { href: "/dashboard", label: "Início", icon: IconHome },
  { href: "/dashboard/agendamentos", label: "Agendar", icon: IconCalendar },
  { href: "/dashboard/clientes", label: "Clientes", icon: IconUsers },
  { href: "/dashboard/cortes", label: "Cortes", icon: IconScissors },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-gray-800"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      aria-label="Menu principal"
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 gap-0.5 transition-colors ${
                isActive ? "text-amber-400" : "text-gray-400 active:text-white"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-6 h-6 shrink-0" aria-hidden />
              <span className="text-[10px] font-medium truncate max-w-full px-1">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
