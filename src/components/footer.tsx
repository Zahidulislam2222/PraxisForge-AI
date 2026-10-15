import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { content, settings } from "@/lib/content";
import { sitePages } from "@/lib/site-pages";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Brand />
          <p>{content.footer.description}</p>
        </div>
        <nav
          className="footer-directory"
          aria-label={content.ui.footerNavigation}
        >
          {content.footer.groups.map((group) => (
            <div className="footer-group" key={group.label}>
              <h2>{group.label}</h2>
              {group.links.map((link) => (
                <Link key={link.route} href={settings.routes[link.route]}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
      <div className="footer-contact">
        <a href={`mailto:${sitePages.common.contactEmail}`}>
          {sitePages.common.contactEmail}
          <ArrowUpRight size={15} />
        </a>
        <a href={settings.external.hermes} target="_blank" rel="noreferrer">
          {content.footer.hermes}
          <ArrowUpRight size={15} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>{content.footer.copyright}</span>
        <span>{content.footer.credit}</span>
        <span className="footer-status">
          <i />
          {content.footer.status}
        </span>
      </div>
    </footer>
  );
}
