import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowUp, Check, Plus, ChevronRight } from "lucide-react";
import { content, settings } from "@/lib/content";
import { sitePages, type PageKey, type SiteSection } from "@/lib/site-pages";
import { Navigation } from "./navigation";
import { Footer } from "./footer";
import { Reveal } from "./reveal";
import { ContactCard } from "./contact-card";

function Sources({
  sources,
}: {
  sources: NonNullable<SiteSection["sources"]>;
}) {
  return (
    <div className="page-sources">
      <p className="eyebrow">{sitePages.common.sourcesLabel}</p>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label}
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({ section, index }: { section: SiteSection; index: number }) {
  const c = sitePages.common;
  return (
    <section
      id={`chapter-${section.id}`}
      className={`editorial-section layout-${section.layout}`}
      aria-labelledby={`title-${section.id}`}
    >
      <Reveal className="editorial-section-heading">
        <span className="chapter-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
          <h2 id={`title-${section.id}`}>{section.title}</h2>
          {section.intro && (
            <p className="section-description">{section.intro}</p>
          )}
        </div>
      </Reveal>
      {section.paragraphs && (
        <div className="editorial-prose">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}
      <div className={`editorial-items items-${section.layout}`}>
        {section.items.map((item, itemIndex) =>
          section.layout === "faq" ? (
            <details className="page-faq" key={item.title}>
              <summary>
                {item.title}
                <Plus size={20} aria-hidden="true" />
              </summary>
              <div>
                <p>{item.body}</p>
                {item.bullets && (
                  <ul>
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {item.link && (
                  <Link
                    className="text-link"
                    href={settings.routes[item.link.route]}
                  >
                    {item.link.label}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </details>
          ) : (
            <Reveal
              key={item.title}
              className={`editorial-item${item.featured ? " is-featured" : ""}${item.price ? " has-price" : ""}`}
            >
              <div className="editorial-item-top">
                {section.layout === "steps" && (
                  <span className="step-number">
                    {String(itemIndex + 1).padStart(2, "0")}
                  </span>
                )}
                {item.eyebrow && <p className="eyebrow">{item.eyebrow}</p>}
                {item.status && (
                  <span className={`page-status status-${item.status}`}>
                    <i />
                    {item.status === "available"
                      ? c.availableLabel
                      : item.status === "planned"
                        ? c.plannedLabel
                        : c.limitedLabel}
                  </span>
                )}
                {item.meta && <span className="item-meta">{item.meta}</span>}
              </div>
              <h3>{item.title}</h3>
              {item.price && (
                <div className="page-price">
                  <strong>{item.price.amount}</strong>
                  <span>{item.price.period}</span>
                  <p>{item.price.detail}</p>
                </div>
              )}
              <p className="item-body">{item.body}</p>
              {item.bullets && (
                <ul className="item-bullets">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>
                      <Check size={15} aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
              {item.link && (
                <Link
                  className="text-link"
                  href={settings.routes[item.link.route]}
                >
                  {item.link.label}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              )}
            </Reveal>
          ),
        )}
      </div>
      {section.sources && <Sources sources={section.sources} />}
    </section>
  );
}

export function EditorialPage({ pageKey }: { pageKey: PageKey }) {
  const page = sitePages.pages[pageKey];
  const c = sitePages.common;
  const isLegal = [
    "legal",
    "privacy",
    "terms",
    "cookies",
    "accessibility",
  ].includes(pageKey);
  const hasArt = pageKey === "product" || pageKey === "about";
  return (
    <>
      <Navigation />
      <main
        id="main"
        className={`editorial-page page-${pageKey}${isLegal ? " page-legal" : ""}`}
      >
        <section
          id="page-top"
          className={`page-masthead section-padding${hasArt ? " with-art" : ""}`}
        >
          <nav className="breadcrumbs" aria-label={c.sectionLabel}>
            <Link href={settings.routes.home}>{c.breadcrumbHome}</Link>
            <ChevronRight size={13} aria-hidden="true" />
            <span aria-current="page">{page.eyebrow}</span>
          </nav>
          <div className="page-masthead-grid">
            <Reveal className="page-masthead-copy">
              <p className="eyebrow">{page.eyebrow}</p>
              <h1>
                {page.title}
                <br />
                <em>{page.accent}</em>
              </h1>
              <p className="page-intro">{page.intro}</p>
              <div className="page-hero-meta">
                <span className="page-preview-label">
                  <i />
                  {c.previewLabel}
                </span>
                {page.updated && (
                  <span>
                    {c.updatedLabel}{" "}
                    <time dateTime={page.updated}>{page.updated}</time>
                  </span>
                )}
              </div>
            </Reveal>
            {hasArt && (
              <div className="page-masthead-art">
                <Image
                  src={settings.media.heroSmall}
                  alt=""
                  width={960}
                  height={540}
                  sizes="(max-width: 900px) 100vw, 36vw"
                  priority
                />
                <span>{content.hero.label}</span>
                <div className="art-corner" aria-hidden="true">
                  ✳
                </div>
              </div>
            )}
          </div>
          {page.notice && (
            <div className="page-notice">
              <span>{page.notice.label}</span>
              <p>{page.notice.text}</p>
            </div>
          )}
        </section>
        <div className="editorial-body section-padding">
          <aside className="page-toc">
            <p className="eyebrow">{c.sectionLabel}</p>
            <nav aria-label={c.sectionLabel}>
              {page.sections.map((section, index) => (
                <a key={section.id} href={`#chapter-${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.title}
                </a>
              ))}
            </nav>
            <a className="back-to-top" href="#page-top">
              {c.backToTop}
              <ArrowUp size={14} aria-hidden="true" />
            </a>
          </aside>
          <div className="editorial-chapters">
            {pageKey === "contact" && <ContactCard />}
            {page.sections.map((section, index) => (
              <Section key={section.id} section={section} index={index} />
            ))}
            {page.sources && <Sources sources={page.sources} />}
          </div>
        </div>
        <section className="page-closing section-padding">
          <Reveal>
            <p className="eyebrow">{page.cta.eyebrow}</p>
            <h2>{page.cta.title}</h2>
            <p>{page.cta.text}</p>
            <div className="page-closing-actions">
              <Link
                className="button button-ivory"
                href={settings.routes[page.cta.primary.route]}
              >
                {page.cta.primary.label}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              {page.cta.secondary && (
                <Link
                  className="button page-secondary"
                  href={settings.routes[page.cta.secondary.route]}
                >
                  {page.cta.secondary.label}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              )}
            </div>
          </Reveal>
          <span className="closing-mark" aria-hidden="true">
            ✳
          </span>
        </section>
      </main>
      <Footer />
    </>
  );
}
