"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X, Pause, Play } from "lucide-react";
import { content, settings } from "@/lib/content";
import { Brand } from "./brand";
import { useSiteMotion } from "./motion-provider";

export function Navigation() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const { enabled, reduced, toggle } = useSiteMotion();
  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand />
        <nav aria-label={content.ui.mainNavigation} className="desktop-nav">
          {content.nav.map((item) => (
            <Link
              key={item.label}
              href={settings.routes[item.route]}
              aria-current={
                pathname === settings.routes[item.route] ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <button
            className="motion-toggle"
            onClick={toggle}
            disabled={reduced}
            aria-label={
              reduced
                ? content.ui.reducedMotion
                : enabled
                  ? content.ui.pauseMotion
                  : content.ui.enableMotion
            }
            title={
              reduced
                ? content.ui.reducedMotion
                : enabled
                  ? content.ui.pauseMotion
                  : content.ui.enableMotion
            }
          >
            {enabled ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <Link className="nav-cta" href={settings.routes.workspace}>
            {content.ui.openWorkspace} <ArrowUpRight size={16} />
          </Link>
          <button
            className="menu-toggle"
            ref={toggleRef}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? content.ui.closeMenu : content.ui.menu}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav"
          aria-label={content.ui.mobileNavigation}
        >
          {content.nav.map((item) => (
            <Link
              onClick={() => setOpen(false)}
              key={item.label}
              href={settings.routes[item.route]}
              aria-current={
                pathname === settings.routes[item.route] ? "page" : undefined
              }
            >
              {item.label}
              <ArrowUpRight size={18} />
            </Link>
          ))}
          <Link onClick={() => setOpen(false)} href={settings.routes.workspace}>
            {content.ui.openWorkspace}
            <ArrowUpRight size={18} />
          </Link>
        </nav>
      )}
    </header>
  );
}
