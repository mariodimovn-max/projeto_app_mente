"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./PrimaryNav.module.css";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Início",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M4 11.5 12 5l8 6.5M6 10v8.5a.5.5 0 0 0 .5.5H10v-5a2 2 0 0 1 4 0v5h3.5a.5.5 0 0 0 .5-.5V10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/historico",
    label: "Histórico",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 8v4.5l3 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/insights",
    label: "Insights",
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          d="M12 4.5c.9 2.7 1.8 3.6 4.5 4.5-2.7.9-3.6 1.8-4.5 4.5-.9-2.7-1.8-3.6-4.5-4.5 2.7-.9 3.6-1.8 4.5-4.5ZM18.5 14.5c.5 1.4.9 1.8 2.3 2.3-1.4.5-1.8.9-2.3 2.3-.5-1.4-.9-1.8-2.3-2.3 1.4-.5 1.8-.9 2.3-2.3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

// Barra de navegação persistente entre as telas principais (Story 4.1) — não
// participa do fluxo do documento (position: fixed), por isso cada tela que a
// inclui reserva espaço próprio no rodapé via padding.
export function PrimaryNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.item}
            data-active={isActive || undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
