"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type BarbershopInfo = { profileComplete?: boolean };

export default function ProfileGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard")) return;
    if (pathname === "/dashboard/configuracoes") {
      setChecked(true);
      return;
    }
    fetch("/api/barbershop/info")
      .then((r) => r.json())
      .then((data: BarbershopInfo) => {
        if (data.profileComplete === false) {
          router.replace("/dashboard/configuracoes?setup=1");
          return;
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [pathname, router]);

  if (!checked && pathname !== "/dashboard/configuracoes") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-400">Verificando…</p>
      </div>
    );
  }

  return <>{children}</>;
}
