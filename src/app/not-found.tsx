import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { content } from "@/lib/content";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main id="main" className="not-found">
      <Brand />
      <p className="eyebrow">{content.notFound.eyebrow}</p>
      <h1>
        {content.notFound.lineOne}
        <br />
        <em>{content.notFound.lineTwo}</em>
      </h1>
      <Link className="button button-dark" href="/">
        <ArrowLeft size={17} />
        {content.notFound.back}
      </Link>
    </main>
  );
}
