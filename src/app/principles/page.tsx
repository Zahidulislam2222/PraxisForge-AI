import Link from "next/link";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { content, settings } from "@/lib/content";
import { routeMetadata } from "@/lib/site-routing";

export const metadata = routeMetadata(
  `${content.metadata.principlesTitle} — ${content.brand} ${content.brandSuffix}`,
  content.principles.intro,
  "principles",
);
export default function PrinciplesPage() {
  const p = content.principles;
  return (
    <>
      <Navigation />
      <main id="main" className="principles-page">
        <section className="principles-hero section-padding">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} />
            {content.ui.backHome}
          </Link>
          <Reveal>
            <p className="eyebrow">{p.eyebrow}</p>
            <h1>
              {p.title}
              <br />
              <em>{p.italic}</em>
            </h1>
            <p className="section-description">{p.intro}</p>
          </Reveal>
          <div className="honesty-note">
            <span className="tiny-dot" />
            <p>{p.notice}</p>
          </div>
        </section>
        <section
          className="principles-list section-padding"
          aria-label="Our design principles"
        >
          {p.items.map((item, i) => (
            <Reveal key={item.title} className="principle-row">
              <span>0{i + 1}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </Reveal>
          ))}
          <div className="principles-cta">
            <h2>
              A considered place
              <br />
              <em>to begin.</em>
            </h2>
            <Link
              href={settings.routes.workspace}
              className="button button-dark"
            >
              {content.ui.openWorkspace}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
