"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Unplug,
  Network,
  Search,
  ChevronRight,
  RotateCcw,
  Plus,
  X,
  Check,
  Ban,
  Clock3,
  CircleCheck,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Brand, ForgeMark, AgentSymbol } from "./brand";
import {
  content as c,
  settings,
  demoData,
  statusLabels,
  type DemoTask,
  type TaskStatus,
  type WorkspaceView,
} from "@/lib/content";
import { decideProposal, summarizeTasks, visibleTasks } from "@/lib/demo";

const views: {
  id: WorkspaceView;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "overview", label: c.ui.overview, icon: LayoutDashboard },
  { id: "approvals", label: c.ui.needsApproval, icon: ShieldCheck },
  { id: "agents", label: c.ui.agents, icon: Network },
  { id: "knowledge", label: c.ui.knowledge, icon: FileText },
  { id: "connections", label: c.ui.connections, icon: Unplug },
];

const subscribeLocation = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
};
const getLocation = () => window.location.search;
const getServerLocation = () => "";

function TaskIcon({ status }: { status: TaskStatus }) {
  return status === "completed" ? (
    <CircleCheck size={19} />
  ) : status === "unknown" || status === "blocked" ? (
    <AlertCircle size={19} />
  ) : (
    <MessageSquare size={19} />
  );
}

function DetailDialog({
  task,
  onClose,
  onDecision,
  onKnowledge,
}: {
  task: DemoTask | undefined;
  onClose: () => void;
  onDecision: (id: string, decision: "approve" | "reject") => void;
  onKnowledge: (sourceId: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tabState, setTabState] = useState({
    taskId: task?.id,
    tab: "overview",
  });
  const tab = tabState.taskId === task?.id ? tabState.tab : "overview";
  function setTab(next: string) {
    setTabState({ taskId: task?.id, tab: next });
  }
  useEffect(() => {
    const element = dialog.current;
    if (task && element && !element.open) element.showModal();
    if (!task && element?.open) element.close();
  }, [task]);
  return (
    <dialog
      className="task-dialog"
      ref={dialog}
      onClose={onClose}
      aria-labelledby="task-dialog-title"
      data-lenis-prevent
    >
      {task && (
        <>
          <div className="dialog-top">
            <span>
              {task.id} / {task.type}
            </span>
            <button
              className="icon-button"
              onClick={onClose}
              aria-label={c.ui.close}
            >
              <X size={20} />
            </button>
          </div>
          <div className="dialog-heading">
            <span className={`status status-${task.status}`}>
              {statusLabels[task.status]}
            </span>
            <h2 id="task-dialog-title">{task.title}</h2>
            <p>{task.description}</p>
            <span className="dialog-client">
              {task.client} <span>·</span> {task.agent}
            </span>
          </div>
          <div className="dialog-tabs" role="tablist" aria-label="Task details">
            {["overview", "evidence", "activity"].map((id) => (
              <button
                role="tab"
                id={`detail-tab-${id}`}
                aria-selected={tab === id}
                aria-controls="detail-panel"
                tabIndex={tab === id ? 0 : -1}
                key={id}
                onClick={() => setTab(id)}
                onKeyDown={(event) => {
                  const tabs = ["overview", "evidence", "activity"];
                  const index = tabs.indexOf(id);
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % tabs.length
                      : event.key === "ArrowLeft"
                        ? (index + tabs.length - 1) % tabs.length
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? tabs.length - 1
                            : -1;
                  if (next >= 0) {
                    event.preventDefault();
                    setTab(tabs[next]);
                    document
                      .getElementById(`detail-tab-${tabs[next]}`)
                      ?.focus();
                  }
                }}
              >
                {c.ui[id as "overview" | "evidence" | "activity"]}
              </button>
            ))}
          </div>
          <div
            id="detail-panel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`detail-tab-${tab}`}
            className="dialog-body"
          >
            {tab === "overview" ? (
              <>
                <div className="action-meta">
                  <div>
                    <span>{c.ui.recipient}</span>
                    <strong>{task.recipient}</strong>
                  </div>
                  <div>
                    <span>{c.ui.account}</span>
                    <strong>{task.account}</strong>
                  </div>
                  <div>
                    <span>{c.ui.operation}</span>
                    <strong>{task.type}</strong>
                  </div>
                </div>
                <div className="message-preview">
                  <div>
                    <FileText size={16} />
                    <span>{task.subject}</span>
                  </div>
                  <p>{task.body}</p>
                </div>
                {task.status === "completed" && (
                  <div className="receipt-box">
                    <Check size={18} />
                    <div>
                      <strong>{c.ui.receipt}</strong>
                      <p>{c.workspaceCopy.receiptBody}</p>
                      <code>
                        {c.workspaceCopy.receiptId} / {task.id}
                      </code>
                    </div>
                  </div>
                )}
                {task.status === "unknown" && (
                  <div className="uncertain-box">
                    <Clock3 size={19} />
                    <p>{task.body}</p>
                  </div>
                )}
              </>
            ) : tab === "evidence" ? (
              <div className="evidence-list">
                <p className="eyebrow">{c.workspaceCopy.sources}</p>
                {task.sources.map((source, i) => {
                  const record = demoData.sources.find(
                    (item) => item.name === source,
                  );
                  return (
                    <button
                      onClick={() => {
                        if (record) onKnowledge(record.id);
                      }}
                      key={source}
                      disabled={!record}
                    >
                      <span className="source-number">0{i + 1}</span>
                      <div>
                        <strong>{source}</strong>
                        <span>
                          {record
                            ? `${c.ui.demoOnly} · ${c.ui.source}`
                            : c.ui.sourceUnavailable}
                        </span>
                      </div>
                      <ArrowUpRight size={17} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <ol className="activity-list">
                {task.events.map((event, i) => (
                  <li key={event}>
                    <span>
                      <Check size={12} />
                    </span>
                    <div>
                      <strong>{event}</strong>
                      <p>
                        {task.id} · 0{i + 1}
                      </p>
                    </div>
                  </li>
                ))}
                {task.status === "completed" &&
                  task.id === settings.demo.defaultTask && (
                    <li>
                      <span>
                        <Check size={12} />
                      </span>
                      <div>
                        <strong>{c.workspaceCopy.recorded}</strong>
                        <p>{c.ui.demoOnly}</p>
                      </div>
                    </li>
                  )}
              </ol>
            )}
          </div>
          <div className="dialog-footer">
            <p>
              {task.status === "approval"
                ? c.workspaceCopy.approvalHint
                : settings.demo.disclaimer}
            </p>
            {task.status === "approval" && (
              <div>
                <button
                  className="button button-outline"
                  onClick={() => onDecision(task.id, "reject")}
                >
                  <Ban size={16} />
                  {c.ui.reject}
                </button>
                <button
                  className="button button-dark"
                  onClick={() => onDecision(task.id, "approve")}
                >
                  <Check size={16} />
                  {c.ui.approve}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}

export function Workspace() {
  const [viewOverride, setView] = useState<WorkspaceView | undefined>(
    undefined,
  );
  const [tasks, setTasks] = useState<DemoTask[]>(demoData.tasks);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [selectionOverride, setSelected] = useState<string | null | undefined>(
    undefined,
  );
  const [notice, setNotice] = useState("");
  const [picker, setPicker] = useState(false);
  const [sourceId, setSourceId] = useState(demoData.sources[0].id);
  const [agentId, setAgentId] = useState(c.agents[0].id);
  const location = useSyncExternalStore(
    subscribeLocation,
    getLocation,
    getServerLocation,
  );
  const params = new URLSearchParams(location);
  const requestedTask = params.get("task");
  const requestedView = params.get("view");
  const selected =
    selectionOverride === undefined ? requestedTask : selectionOverride;
  const view: WorkspaceView =
    viewOverride ||
    (views.some((item) => item.id === requestedView)
      ? (requestedView as WorkspaceView)
      : "overview");
  const selectedTask = tasks.find((task) => task.id === selected);
  const shown = visibleTasks(
    tasks,
    query,
    view === "approvals" ? "approval" : filter,
  );
  const summary = summarizeTasks(tasks);
  const source =
    demoData.sources.find((item) => item.id === sourceId) ||
    demoData.sources[0];
  const agent = c.agents.find((item) => item.id === agentId) || c.agents[0];
  function navigate(next: WorkspaceView) {
    setView(next);
    setQuery("");
    setFilter("all");
    setNotice("");
    setPicker(false);
  }
  function decide(id: string, decision: "approve" | "reject") {
    setTasks((current) => decideProposal(current, id, decision));
    setNotice(
      decision === "approve" ? c.ui.approvedNotice : c.ui.rejectedNotice,
    );
  }
  function reset() {
    setTasks(demoData.tasks);
    setSelected(null);
    setFilter("all");
    setQuery("");
    setNotice(c.ui.resetNotice);
  }
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Brand light />
        <div className="workspace-switcher">
          <span>{settings.demo.workspaceTag}</span>
          <div>
            <strong>{settings.demo.workspace}</strong>
            <small>{settings.demo.label}</small>
          </div>
          <ChevronRight size={15} />
        </div>
        <p className="sidebar-label">{c.ui.workspace}</p>
        <nav aria-label="Workspace navigation">
          {views.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              aria-current={view === id ? "page" : undefined}
              aria-label={label}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "approvals" && summary[1] > 0 && (
                <small>{summary[1]}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div>
            <ForgeMark />
            <p>{settings.demo.disclaimer}</p>
          </div>
          <Link href="/">
            <ArrowLeft size={16} />
            {c.ui.backHome}
          </Link>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <span>{settings.demo.workspace}</span>
            <ChevronRight size={13} />
            <strong>{views.find((v) => v.id === view)?.label}</strong>
          </div>
          <div>
            <span className="workspace-demo-tag">
              <i />
              {settings.demo.label}
            </span>
            <button
              className="icon-button"
              onClick={reset}
              aria-label={c.ui.resetDemo}
              title={c.ui.resetDemo}
            >
              <RotateCcw size={17} />
            </button>
            <span className="user-avatar">Y</span>
          </div>
        </header>
        <main id="main" className="workspace-content">
          <div className="workspace-mobile-home">
            <Link href="/">
              <ArrowLeft size={16} />
              {c.ui.backHome}
            </Link>
          </div>
          <p className="workspace-demo-notice">{settings.demo.disclaimer}</p>
          <div className="workspace-page-title">
            <div>
              <p className="eyebrow">{settings.demo.date}</p>
              <h1>
                {view === "overview"
                  ? c.workspaceCopy.greeting
                  : view === "approvals"
                    ? c.ui.needsApproval
                    : view === "agents"
                      ? c.workspaceCopy.agentHeading
                      : view === "knowledge"
                        ? c.workspaceCopy.knowledgeHeading
                        : c.workspaceCopy.connectionsHeading}
              </h1>
              <p>
                {view === "overview" || view === "approvals"
                  ? c.workspaceCopy.subtitle
                  : view === "agents"
                    ? c.workspaceCopy.agentDescription
                    : view === "knowledge"
                      ? c.workspaceCopy.knowledgeDescription
                      : c.workspaceCopy.connectionsDescription}
              </p>
            </div>
            <button
              className="button button-dark request-button"
              onClick={() => setPicker(!picker)}
              aria-expanded={picker}
            >
              <Plus size={16} />
              {c.ui.newRequest}
            </button>
          </div>
          <div className="toast-region" aria-live="polite" role="status">
            {notice && (
              <div className="workspace-notice">
                <Check size={17} />
                <p>{notice}</p>
                <button
                  className="icon-button"
                  aria-label={c.ui.close}
                  onClick={() => setNotice("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {picker && (
            <section
              className="request-picker"
              aria-label={c.ui.simulateRequest}
            >
              <div>
                <h2>{c.workspaceCopy.newRequestHeading}</h2>
                <p>{c.workspaceCopy.newRequestBody}</p>
              </div>
              {demoData.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelected(task.id);
                    setPicker(false);
                  }}
                >
                  <span>{task.type}</span>
                  {task.title}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </section>
          )}
          {(view === "overview" || view === "approvals") && (
            <>
              <div className="workspace-metrics">
                {c.workspaceCopy.summary.map((label, i) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{String(summary[i]).padStart(2, "0")}</strong>
                    <span className={`metric-mark metric-${i}`}>
                      <span />
                    </span>
                  </div>
                ))}
              </div>
              <section className="task-section">
                <div className="task-section-header">
                  <div>
                    <h2>{c.workspaceCopy.taskHeading}</h2>
                    <p>{c.workspaceCopy.taskDescription}</p>
                  </div>
                  <div className="task-search">
                    <Search size={16} />
                    <label className="sr-only" htmlFor="task-search">
                      {c.ui.search}
                    </label>
                    <input
                      id="task-search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={c.ui.search}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        onClick={() => setQuery("")}
                        aria-label={c.ui.clearSearch}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {view === "overview" && (
                  <div
                    className="task-filters"
                    role="group"
                    aria-label="Filter tasks by status"
                  >
                    {(
                      [
                        "all",
                        "approval",
                        "completed",
                        "blocked",
                        "unknown",
                      ] as const
                    ).map((status) => (
                      <button
                        key={status}
                        className={filter === status ? "active" : ""}
                        aria-pressed={filter === status}
                        onClick={() => setFilter(status)}
                      >
                        {status === "all"
                          ? c.ui.allTasks
                          : statusLabels[status]}
                        {status === "approval" && <span>{summary[1]}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="task-table">
                  <div className="task-table-head">
                    <span>{c.workspaceCopy.task}</span>
                    <span>{c.workspaceCopy.client}</span>
                    <span>{c.workspaceCopy.status}</span>
                    <span />
                  </div>
                  {shown.map((task) => (
                    <button
                      key={task.id}
                      className="task-row"
                      onClick={() => setSelected(task.id)}
                    >
                      <div>
                        <span className={`task-icon task-icon-${task.status}`}>
                          <TaskIcon status={task.status} />
                        </span>
                        <div>
                          <strong>{task.title}</strong>
                          <small>
                            {task.id} · {task.agent} · {task.time}
                          </small>
                        </div>
                      </div>
                      <span className="task-client">{task.client}</span>
                      <span className={`status status-${task.status}`}>
                        {statusLabels[task.status]}
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                  {shown.length === 0 && (
                    <div className="task-empty">
                      <Search size={24} />
                      <p>
                        {query ? c.ui.noResults : c.workspaceCopy.emptyFilter}
                      </p>
                      <button
                        className="text-link"
                        onClick={() => {
                          setQuery("");
                          setFilter("all");
                        }}
                      >
                        {c.ui.clearSearch}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="task-table-footer">
                  <span>
                    {shown.length} / {tasks.length}{" "}
                    <span>{c.ui.allTasks.toLowerCase()}</span>
                  </span>
                  <span>
                    <ShieldCheck size={13} />
                    {c.ui.demoOnly}
                  </span>
                </div>
              </section>
              <div className="workspace-bottom-grid">
                <section className="team-overview">
                  <div className="panel-heading">
                    <h2>{c.workspaceCopy.agentHeading}</h2>
                    <button
                      onClick={() => navigate("agents")}
                      aria-label={c.ui.agents}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  {c.agents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setAgentId(item.id);
                        navigate("agents");
                      }}
                    >
                      <span className="team-symbol">
                        <AgentSymbol kind={item.symbol} />
                      </span>
                      <div>
                        <strong>{item.short}</strong>
                        <span>{item.abilities[0]}</span>
                      </div>
                      <span className="role-dot" />
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </section>
                <section className="source-overview">
                  <div className="panel-heading">
                    <h2>{c.workspaceCopy.sources}</h2>
                    <button
                      onClick={() => navigate("knowledge")}
                      aria-label={c.ui.knowledge}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </div>
                  {demoData.sources.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSourceId(item.id);
                        navigate("knowledge");
                      }}
                    >
                      <FileText size={19} />
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.kind} · {item.version}
                        </span>
                      </div>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </section>
              </div>
            </>
          )}
          {view === "agents" && (
            <section className="workspace-agents">
              <div
                className="workspace-agent-tabs"
                role="group"
                aria-label="Choose specialist"
              >
                {c.agents.map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={agentId === item.id}
                    className={agentId === item.id ? "active" : ""}
                    onClick={() => setAgentId(item.id)}
                  >
                    <span>{item.number}</span>
                    <AgentSymbol kind={item.symbol} />
                    <strong>{item.name}</strong>
                    <small>{item.role}</small>
                  </button>
                ))}
              </div>
              <div className="agent-detail">
                <div>
                  <p className="eyebrow">{agent.role}</p>
                  <h2>{agent.name}</h2>
                  <p>{agent.description}</p>
                  <div className="agent-detail-abilities">
                    {agent.abilities.map((ability) => (
                      <span key={ability}>
                        <Check size={15} />
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>
                <AgentSymbol kind={agent.symbol} />
              </div>
            </section>
          )}
          {view === "knowledge" && (
            <section className="knowledge-grid">
              <nav aria-label="Knowledge sources">
                {demoData.sources.map((item) => (
                  <button
                    key={item.id}
                    className={sourceId === item.id ? "active" : ""}
                    onClick={() => setSourceId(item.id)}
                    aria-pressed={sourceId === item.id}
                  >
                    <FileText size={20} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.kind}</small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ))}
              </nav>
              <article className="source-document">
                <div className="source-document-top">
                  <span>{source.kind}</span>
                  <span>
                    {source.version} · {source.updated}
                  </span>
                </div>
                <span className="source-document-icon">
                  <FileText size={30} />
                </span>
                <h2>{source.name}</h2>
                <p className="source-owner">
                  {source.client} · {c.ui.demoOnly}
                </p>
                <div className="source-excerpt">
                  <p>{source.excerpt}</p>
                </div>
                <div className="source-provenance">
                  <ShieldCheck size={16} />
                  <p>{c.control.items[0].description}</p>
                </div>
              </article>
            </section>
          )}
          {view === "connections" && (
            <section className="connection-grid">
              {demoData.connections.map((connection, i) => (
                <article className="connection-card" key={connection.name}>
                  <div>
                    <span className={`integration-icon integration-${i}`}>
                      {connection.initial}
                    </span>
                    <span className="connection-state">{connection.state}</span>
                  </div>
                  <h2>{connection.name}</h2>
                  <p>{connection.description}</p>
                  <span className="connection-scope">{connection.scope}</span>
                  <Link href={settings.routes.principles}>
                    {c.footer.principles}
                    <ExternalLink size={15} />
                  </Link>
                </article>
              ))}
            </section>
          )}
          <footer className="workspace-footer">
            <span>
              <ForgeMark />
              {c.footer.description}
            </span>
            <Link href={settings.routes.principles}>
              {c.footer.principles}
              <ArrowUpRight size={13} />
            </Link>
          </footer>
        </main>
      </div>
      <DetailDialog
        task={selectedTask}
        onClose={() => setSelected(null)}
        onDecision={decide}
        onKnowledge={(sourceId) => {
          setSourceId(sourceId);
          setSelected(null);
          navigate("knowledge");
        }}
      />
    </div>
  );
}
