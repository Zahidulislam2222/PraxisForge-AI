"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Check,
  ChevronRight,
  FileText,
  CircleDot,
  ShieldCheck,
  MessageSquare,
  CheckCheck,
  Plus,
} from "lucide-react";
import { content as c, settings, demoData, statusLabels } from "@/lib/content";
import { AgentSymbol, ForgeMark } from "./brand";
import { Reveal } from "./reveal";
import { Navigation } from "./navigation";
import { Footer } from "./footer";
import { useSiteMotion } from "./motion-provider";

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { enabled } = useSiteMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [0, settings.motion.heroParallax],
  );
  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <motion.div className="hero-art" style={{ y: enabled ? y : 0 }}>
        <Image
          src={settings.media.hero}
          alt="Interlocking titanium ribbons illuminated from within by warm copper light"
          fill
          priority
          sizes="100vw"
        />
      </motion.div>
      <div className="hero-shade" />
      <div className="hero-topline">
        <span>
          <i />
          {c.hero.preview}
        </span>
        <span>{c.hero.label}</span>
      </div>
      <div className="hero-content">
        <Reveal>
          <p className="eyebrow">{c.hero.eyebrow}</p>
          <h1 id="hero-title">
            {c.hero.lineOne}
            <br />
            <em>{c.hero.lineTwo}</em>
          </h1>
          <p className="hero-description">{c.hero.description}</p>
          <p className="hero-detail">{c.hero.detail}</p>
          <div className="hero-buttons">
            <Link
              href={settings.routes.workspace}
              className="button button-ivory"
            >
              {c.ui.openWorkspace}
              <ArrowUpRight size={18} />
            </Link>
            <a href="#workflow" className="hero-text-link">
              {c.ui.seeWorkflow}
              <span className="round-arrow">
                <ArrowDown size={16} />
              </span>
            </a>
          </div>
        </Reveal>
      </div>
      <div className="hero-bottom">
        <a href="#platform" className="scroll-cue">
          <span className="scroll-line" />
          {c.hero.scroll}
        </a>
        <p>{c.hero.caption}</p>
        <ForgeMark />
      </div>
    </section>
  );
}

function Workflow() {
  const [active, setActive] = useState(0);
  const step = c.workflow.steps[active];
  return (
    <section id="workflow" className="workflow-section section-padding">
      <div className="workflow-intro">
        <Reveal>
          <p className="eyebrow">{c.workflow.eyebrow}</p>
          <h2>
            {c.workflow.title}
            <br />
            <em>{c.workflow.italic}</em>
          </h2>
          <p className="section-description">{c.workflow.description}</p>
        </Reveal>
        <div
          className="workflow-steps"
          role="tablist"
          aria-label="Agency workflow stages"
        >
          {c.workflow.steps.map((s, i) => (
            <button
              key={s.number}
              role="tab"
              aria-selected={active === i}
              aria-controls="workflow-panel"
              id={`workflow-tab-${i}`}
              className={`workflow-step ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  setActive((i + 1) % c.workflow.steps.length);
                  document
                    .getElementById(
                      `workflow-tab-${(i + 1) % c.workflow.steps.length}`,
                    )
                    ?.focus();
                }
                if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const previous =
                    (i + c.workflow.steps.length - 1) % c.workflow.steps.length;
                  setActive(previous);
                  document.getElementById(`workflow-tab-${previous}`)?.focus();
                }
              }}
              tabIndex={active === i ? 0 : -1}
            >
              <span className="step-number">{s.number}</span>
              <div>
                <h3>{s.title}</h3>
                {i === active && <p>{s.description}</p>}
              </div>
              <ArrowUpRight size={18} />
            </button>
          ))}
        </div>
      </div>
      <div className="workflow-visual">
        <div className="workflow-art-label">
          <span className="tiny-dot" />
          {c.previewCopy.agency}
          <span>{c.previewCopy.example}</span>
        </div>
        <div className="request-bubble">
          <div className="request-avatar">{c.previewCopy.you}</div>
          <div>
            <p>{c.workflow.request}</p>
            <span>{c.workflow.requestBy}</span>
          </div>
        </div>
        <div className="handoff-line">
          <span />
        </div>
        <div
          className="workflow-card"
          role="tabpanel"
          id="workflow-panel"
          aria-labelledby={`workflow-tab-${active}`}
          tabIndex={0}
        >
          <div className="workflow-card-top">
            <span className="small-agent">
              <ForgeMark />
              {step.agent}
            </span>
            <span className={`mini-status ${active === 2 ? "warm" : ""}`}>
              <i />
              {step.status}
            </span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              exit={{ y: -4 }}
              transition={{ duration: settings.motion.microSeconds }}
            >
              <h3>{step.heading}</h3>
              <div className="workflow-checks">
                {step.items.map((item) => (
                  <div key={item}>
                    <span>
                      {active === 2 ? (
                        <CircleDot size={14} />
                      ) : (
                        <Check size={14} />
                      )}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <div className="workflow-source">
                <FileText size={14} />
                {step.source}
              </div>
              {active === 2 && (
                <Link
                  className="approval-preview-link"
                  href={`${settings.routes.workspace}?task=${settings.demo.defaultTask}`}
                >
                  {c.ui.reviewAction}
                  <ArrowRight size={15} />
                </Link>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="workflow-visual-footer">
          <span>
            0{active + 1} <span>/ 04</span>
          </span>
          <p>{c.workflow.note}</p>
        </div>
      </div>
    </section>
  );
}

function Agents() {
  const [active, setActive] = useState(0);
  return (
    <section id="agents" className="agents-section section-padding">
      <div className="section-heading">
        <Reveal>
          <p className="eyebrow">{c.agentsSection.eyebrow}</p>
          <h2>
            {c.agentsSection.title}
            <br />
            <em>{c.agentsSection.italic}</em>
          </h2>
        </Reveal>
        <Reveal>
          <p className="section-description">{c.agentsSection.description}</p>
        </Reveal>
      </div>
      <div className="agent-grid">
        {c.agents.map((agent, i) => (
          <button
            className={`agent-panel ${active === i ? "active" : ""}`}
            key={agent.id}
            onClick={() => setActive(i)}
            aria-expanded={active === i}
          >
            <div className="agent-panel-top">
              <span>{agent.number} / SPECIALIST</span>
              <ArrowUpRight size={20} />
            </div>
            <AgentSymbol kind={agent.symbol} />
            <p className="agent-role">{agent.role}</p>
            <h3>{agent.name}</h3>
            <p className="agent-description">{agent.description}</p>
            <div className="agent-abilities" aria-hidden={active !== i}>
              {agent.abilities.map((ability) => (
                <span key={ability}>{ability}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <p className="section-footnote">{c.agentsSection.note}</p>
    </section>
  );
}

export function ConsolePreview() {
  return (
    <div className="console-preview">
      <div className="preview-sidebar">
        <ForgeMark />
        <span className="preview-sidebar-current">
          <CircleDot size={18} />
        </span>
        <FileText size={18} />
        <ShieldCheck size={18} />
        <MessageSquare size={18} />
        <span className="preview-bottom-avatar">
          {settings.demo.workspaceTag}
        </span>
      </div>
      <div className="preview-main">
        <div className="preview-topbar">
          <span>
            {settings.demo.workspace}
            <ChevronRight size={12} />
            {c.previewCopy.overview}
          </span>
          <span className="preview-demo-badge">{c.previewCopy.tag}</span>
        </div>
        <div className="preview-content">
          <div className="preview-welcome">
            <div>
              <p>{c.previewCopy.date}</p>
              <h3>{c.workspaceCopy.greeting}</h3>
            </div>
            <Link href={settings.routes.workspace} className="preview-open">
              <Plus size={14} />
              {c.previewCopy.explore}
            </Link>
          </div>
          <div className="preview-metrics">
            <div>
              <span>{c.previewCopy.metrics[0]}</span>
              <strong>
                04<small>{c.previewCopy.details[0]}</small>
              </strong>
            </div>
            <div>
              <span>{c.previewCopy.metrics[1]}</span>
              <strong>
                01
                <small className="copper-text">
                  {c.previewCopy.details[1]}
                </small>
              </strong>
            </div>
            <div>
              <span>{c.previewCopy.metrics[2]}</span>
              <strong>
                01<small>{c.previewCopy.details[2]}</small>
              </strong>
            </div>
          </div>
          <div className="preview-list-title">
            <span>{c.workspaceCopy.taskHeading}</span>
            <span>
              {c.previewCopy.allActivity}
              <ArrowRight size={12} />
            </span>
          </div>
          <div className="preview-table">
            {demoData.tasks.slice(0, 3).map((task, i) => (
              <Link
                href={`${settings.routes.workspace}?task=${task.id}`}
                className="preview-task"
                key={task.id}
              >
                <div className="preview-task-icon">
                  {i === 0 ? (
                    <MessageSquare size={17} />
                  ) : i === 1 ? (
                    <CheckCheck size={17} />
                  ) : (
                    <FileText size={17} />
                  )}
                </div>
                <div>
                  <strong>{task.title}</strong>
                  <span>
                    {task.client} · {task.agent}
                  </span>
                </div>
                <span className={`status status-${task.status}`}>
                  {statusLabels[task.status]}
                </span>
                <ArrowUpRight size={14} />
              </Link>
            ))}
          </div>
          <div className="preview-note">
            <span className="tiny-dot" />
            {c.previewCopy.note}
            <span>{c.previewCopy.powered}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  return (
    <>
      <Navigation />
      <main id="main">
        <Hero />
        <section id="platform" className="intro-section section-padding">
          <Reveal>
            <p className="eyebrow">{c.intro.eyebrow}</p>
            <h2>
              {c.intro.title}
              <br />
              <em>{c.intro.italic}</em>
            </h2>
          </Reveal>
          <div className="intro-bottom">
            <Reveal className="intro-aside">
              <span className="mini-cross">✳</span>
              <p>{c.intro.aside}</p>
            </Reveal>
            <Reveal className="intro-copy">
              <p>{c.intro.description}</p>
              <div className="principle-tags">
                {c.intro.labels.map((label) => (
                  <span key={label}>
                    <Check size={13} />
                    {label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
        <Workflow />
        <Agents />
        <section className="workspace-section section-padding">
          <div className="workspace-section-top">
            <Reveal>
              <p className="eyebrow">{c.workspaceSection.eyebrow}</p>
              <h2>
                {c.workspaceSection.title}
                <br />
                <em>{c.workspaceSection.italic}</em>
              </h2>
            </Reveal>
            <Reveal>
              <p className="section-description">
                {c.workspaceSection.description}
              </p>
              <Link href={settings.routes.workspace} className="text-link">
                {c.workspaceSection.cta}
                <ArrowUpRight size={18} />
              </Link>
            </Reveal>
          </div>
          <Reveal className="preview-frame">
            <ConsolePreview />
          </Reveal>
          <p className="section-footnote">{c.workspaceSection.note}</p>
        </section>
        <section id="trust" className="control-section section-padding">
          <div className="control-title">
            <Reveal>
              <p className="eyebrow">{c.control.eyebrow}</p>
              <h2>
                {c.control.title}
                <br />
                <em>{c.control.italic}</em>
              </h2>
              <p className="section-description">{c.control.description}</p>
              <Link href={settings.routes.principles} className="text-link">
                {c.footer.principles}
                <ArrowUpRight size={18} />
              </Link>
            </Reveal>
            <div className="control-emblem">
              <ForgeMark />
            </div>
          </div>
          <div className="control-items">
            {c.control.items.map((item) => (
              <Reveal key={item.number} className="control-item">
                <span>{item.number}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="integration-section section-padding">
          <Reveal>
            <p className="eyebrow">{c.integrations.eyebrow}</p>
            <h3>{c.integrations.title}</h3>
          </Reveal>
          <div className="integration-list">
            {c.integrations.items.map((item, i) => (
              <Link
                key={item}
                href={`${settings.routes.workspace}?view=connections`}
              >
                <span className={`integration-icon integration-${i}`}>
                  {i === 3 ? "20" : item.charAt(0)}
                </span>
                {item}
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
          <p className="section-footnote">{c.integrations.note}</p>
        </section>
        <section className="closing-section">
          <div className="closing-art">
            <Image
              src={settings.media.heroSmall}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
            />
          </div>
          <div className="closing-shade" />
          <Reveal className="closing-copy">
            <p className="eyebrow">{c.closing.eyebrow}</p>
            <h2>
              {c.closing.lineOne}
              <br />
              <em>{c.closing.lineTwo}</em>
            </h2>
            <p>{c.closing.description}</p>
            <Link
              href={settings.routes.workspace}
              className="button button-ivory"
            >
              {c.closing.cta}
              <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <span className="closing-index">INTENT → OUTCOME</span>
        </section>
      </main>
      <Footer />
    </>
  );
}
