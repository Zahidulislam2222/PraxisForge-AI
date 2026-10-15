"use client";

import { useState } from "react";
import { ArrowUpRight, Copy } from "lucide-react";
import { content } from "@/lib/content";
import { sitePages } from "@/lib/site-pages";

export function ContactCard() {
  const [notice, setNotice] = useState("");
  const c = sitePages.common;
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(c.contactEmail);
      setNotice(content.ui.emailCopied);
    } catch {
      setNotice(content.ui.emailCopyFailed);
    }
  }
  return (
    <aside className="contact-card" aria-labelledby="contact-card-title">
      <p className="eyebrow">{c.contactEyebrow}</p>
      <h2 id="contact-card-title">{c.contactTitle}</h2>
      <p>{c.contactText}</p>
      <a className="contact-address" href={`mailto:${c.contactEmail}`}>
        {c.contactEmail}
        <ArrowUpRight size={24} aria-hidden="true" />
      </a>
      <div className="contact-card-actions">
        <a className="button button-dark" href={`mailto:${c.contactEmail}`}>
          {c.contactLinkLabel}
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
        <button
          type="button"
          className="button button-outline"
          onClick={copyEmail}
        >
          <Copy size={16} aria-hidden="true" />
          {content.ui.copyEmail}
        </button>
      </div>
      <p className="contact-copy-notice" role="status">
        {notice}
      </p>
    </aside>
  );
}
