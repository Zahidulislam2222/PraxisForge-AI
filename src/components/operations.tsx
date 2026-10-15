"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  Network,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { z } from "zod";
import { Brand } from "./brand";
import { operationsContent as c, settings } from "@/lib/content";
import {
  ApiError,
  capabilitiesSchema,
  coreApi,
  detailSchema,
  documentSchema,
  memorySchema,
  sessionSchema,
  taskSchema,
  type Capabilities,
  type KnowledgeDocument,
  type OwnerSession,
  type RealTask,
  type TaskDetail,
  type WorkspaceMemory,
} from "@/lib/operations";

function TaskDialog({
  detail,
  onClose,
  onDecision,
  onCancel,
  busy,
}: {
  detail: TaskDetail | null;
  onClose: () => void;
  onDecision: (decision: "approve" | "reject") => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (detail && !dialog?.open) dialog?.showModal();
    if (!detail && dialog?.open) dialog.close();
  }, [detail]);
  const action = detail?.approval?.payload;
  function downloadReceipt() {
    if (detail?.status !== "completed" || !detail.receipt) return;
    const taskId = z.uuid().safeParse(detail.id);
    if (!taskId.success) return;
    const payload = {
      task_id: taskId.data,
      receipt: {
        id: detail.receipt.id,
        verification: detail.receipt.verification,
        payload_hash: detail.approval?.payload_hash ?? null,
      },
      approved_action: detail.receipt.artifact,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    try {
      anchor.href = url;
      anchor.download = `${c.receiptFilenamePrefix}-${taskId.data}.json`;
      anchor.hidden = true;
      ref.current?.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      // Release after the browser has processed the download click.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
  return (
    <dialog
      ref={ref}
      className="task-dialog real-dialog"
      onClose={onClose}
      aria-labelledby="real-task-title"
      data-lenis-prevent
    >
      {detail && (
        <>
          <div className="dialog-top">
            <span>
              {c.taskStatuses[detail.status]} / {detail.stage}
            </span>
            <button
              className="icon-button"
              aria-label={c.close}
              onClick={() => ref.current?.close()}
            >
              <X />
            </button>
          </div>
          <div className="dialog-heading">
            <h2 id="real-task-title">{detail.request.client}</h2>
            <p>{detail.request.request}</p>
          </div>
          <div className="real-detail-body">
            {detail.error && (
              <p className="real-notice">
                <strong>{c.error}</strong> {detail.error}
              </p>
            )}
            {detail.result && (
              <section>
                <h3>{c.summary}</h3>
                <p>{detail.result.summary}</p>
              </section>
            )}
            {action && (
              <section>
                <span className="eyebrow">{c.approvalTitle}</span>
                <p className="real-notice">{c.approvalNotice}</p>
                <dl className="real-action-meta">
                  <div>
                    <dt>{c.recipient}</dt>
                    <dd>{action.recipient}</dd>
                  </div>
                  <div>
                    <dt>{c.account}</dt>
                    <dd>{action.account}</dd>
                  </div>
                </dl>
                <h3>{action.subject}</h3>
                <p className="real-preformatted">{action.body}</p>
                <h3>{c.commitments}</h3>
                <ul>
                  {action.commitments.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <h3>{c.sourceIds}</h3>
                <ul>
                  {action.source_ids.map((id) => (
                    <li key={id}>
                      <code>{id}</code>
                    </li>
                  ))}
                </ul>
                <p className="real-small">
                  {c.expiry}:{" "}
                  {new Date(detail.approval!.expires_at).toLocaleString()}
                </p>
                <code className="real-hash">
                  {detail.approval!.payload_hash}
                </code>
              </section>
            )}
            {detail.receipt && (
              <section className="real-receipt">
                <ShieldCheck size={25} />
                <h3>{c.receipt}</h3>
                <p>{detail.receipt.verification}</p>
                <code>{detail.receipt.id}</code>
                {detail.status === "completed" && (
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={downloadReceipt}
                  >
                    {c.downloadReceipt}
                    <Download size={17} />
                  </button>
                )}
              </section>
            )}
            <section>
              <h3>{c.events}</h3>
              <ol className="real-events">
                {detail.events.map((event, index) => (
                  <li key={index}>
                    <span>{event.kind}</span>
                    <time>{new Date(event.created_at).toLocaleString()}</time>
                  </li>
                ))}
              </ol>
            </section>
            <div className="real-button-row">
              {detail.status === "approval" && (
                <>
                  <button
                    className="button button-dark"
                    disabled={busy}
                    onClick={() => onDecision("approve")}
                  >
                    {c.approve}
                    <Check size={17} />
                  </button>
                  <button
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => onDecision("reject")}
                  >
                    {c.reject}
                  </button>
                </>
              )}
              {["queued", "running", "approval"].includes(detail.status) && (
                <button
                  className="button button-outline"
                  disabled={busy}
                  onClick={onCancel}
                >
                  {c.cancel}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}

export function Operations() {
  const [session, setSession] = useState<OwnerSession | null | undefined>(
    undefined,
  );
  const [workspace, setWorkspace] = useState("");
  const [tab, setTab] = useState(0);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [tasks, setTasks] = useState<RealTask[]>([]);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [memory, setMemory] = useState<WorkspaceMemory>({
    episodes: [],
    commitments: [],
  });
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const detailId = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const submissions = useRef(
    new Map<string, { payload: string; key: string }>(),
  );
  const inFlight = useRef(false);
  const scope = useRef({ workspace: "", generation: 0 });
  const switchWorkspace = useCallback((next: string) => {
    scope.current = {
      workspace: next,
      generation: scope.current.generation + 1,
    };
    detailId.current = null;
    if (!next) submissions.current.clear();
    setDetail(null);
    setDocuments([]);
    setTasks([]);
    setMemory({ episodes: [], commitments: [] });
    setCapabilities(null);
    setError("");
    setNotice("");
    setWorkspace(next);
  }, []);
  const fail = useCallback(
    (error: unknown) => {
      setError(error instanceof Error ? error.message : c.genericError);
      if (error instanceof ApiError && error.status === 401) {
        switchWorkspace("");
        setSession(null);
      }
    },
    [switchWorkspace],
  );
  const acceptSession = useCallback(
    (value: OwnerSession) => {
      setSession(value);
      const current = scope.current.workspace;
      switchWorkspace(
        value.workspaces.some((w) => w.id === current)
          ? current
          : (value.workspaces[0]?.id ?? ""),
      );
    },
    [switchWorkspace],
  );
  useEffect(() => {
    let active = true;
    coreApi("/session")
      .then((value) => {
        if (active) acceptSession(sessionSchema.parse(value));
      })
      .catch((error) => {
        if (active) {
          setSession(null);
          if (!(error instanceof ApiError && error.status === 401)) fail(error);
        }
      });
    return () => {
      active = false;
    };
  }, [acceptSession, fail]);
  const refresh = useCallback(async () => {
    if (!workspace || !session) return;
    const generation = scope.current.generation;
    const selectedTask = detailId.current;
    const path = `/workspaces/${workspace}`;
    const values = await Promise.all([
      coreApi(path + "/documents"),
      coreApi(path + "/tasks"),
      coreApi("/capabilities"),
      coreApi(path + "/memory"),
    ]);
    if (
      scope.current.generation !== generation ||
      scope.current.workspace !== workspace
    )
      return;
    setDocuments(z.array(documentSchema).parse(values[0]));
    setTasks(z.array(taskSchema).parse(values[1]));
    setCapabilities(capabilitiesSchema.parse(values[2]));
    setMemory(memorySchema.parse(values[3]));
    if (selectedTask) {
      const value = detailSchema.parse(
        await coreApi(path + "/tasks/" + selectedTask),
      );
      if (
        scope.current.generation === generation &&
        scope.current.workspace === workspace &&
        detailId.current === selectedTask
      )
        setDetail(value);
    }
  }, [workspace, session]);
  useEffect(() => {
    let active = true;
    const update = () =>
      refresh().catch((error) => {
        if (active) fail(error);
      });
    void update();
    const timer = setInterval(update, settings.core.pollMilliseconds);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [refresh, fail]);
  async function action(work: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    const generation = scope.current.generation;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (error) {
      if (scope.current.generation === generation) fail(error);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await action(async () => {
      await coreApi("/login", {
        method: "POST",
        body: { email: data.get("email"), password: data.get("password") },
      });
      form.reset();
      acceptSession(sessionSchema.parse(await coreApi("/session")));
    });
  }
  async function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const generation = scope.current.generation;
    const form = event.currentTarget;
    const data = new FormData(form);
    await action(async () => {
      await coreApi(`/workspaces/${workspace}/documents`, {
        method: "POST",
        csrf: session!.csrf,
        body: {
          title: data.get("title"),
          source: data.get("source"),
          content: data.get("content"),
        },
      });
      if (scope.current.generation !== generation) return;
      form.reset();
      setNotice(c.saved);
      await refresh();
    });
  }
  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const generation = scope.current.generation;
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = {
      request: data.get("request"),
      client: data.get("client"),
      recipient: data.get("recipient"),
      account: "internal-drafts",
      document_ids: data.getAll("document_ids"),
    };
    const payload = JSON.stringify(body);
    const submissionId = workspace + ":" + payload;
    const pending = submissions.current.get(submissionId) ?? {
      payload,
      key: crypto.randomUUID(),
    };
    submissions.current.set(submissionId, pending);
    await action(async () => {
      await coreApi(`/workspaces/${workspace}/tasks`, {
        method: "POST",
        csrf: session!.csrf,
        idempotencyKey: pending.key,
        body,
      });
      if (submissions.current.get(submissionId) === pending)
        submissions.current.delete(submissionId);
      if (scope.current.generation !== generation) return;
      form.reset();
      await refresh();
    });
  }
  async function openTask(id: string) {
    if (inFlight.current) return;
    const generation = scope.current.generation;
    detailId.current = id;
    await action(async () => {
      const value = detailSchema.parse(
        await coreApi(`/workspaces/${workspace}/tasks/${id}`),
      );
      if (
        scope.current.generation === generation &&
        scope.current.workspace === workspace &&
        detailId.current === id
      )
        setDetail(value);
    });
  }
  function closeDetail() {
    detailId.current = null;
    setDetail(null);
  }
  async function decide(decision: "approve" | "reject") {
    if (!detail?.approval) return;
    await action(async () => {
      await coreApi(`/workspaces/${workspace}/tasks/${detail.id}/decision`, {
        method: "POST",
        csrf: session!.csrf,
        body: { decision, payload_hash: detail.approval!.payload_hash },
      });
      await refresh();
    });
  }
  async function cancelTask() {
    if (!detail) return;
    await action(async () => {
      await coreApi(`/workspaces/${workspace}/tasks/${detail.id}/cancel`, {
        method: "POST",
        csrf: session!.csrf,
        body: {},
      });
      await refresh();
    });
  }
  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await action(async () => {
      const value = z.object({ id: z.string() }).parse(
        await coreApi("/workspaces", {
          method: "POST",
          csrf: session!.csrf,
          body: { name: data.get("name") },
        }),
      );
      acceptSession(sessionSchema.parse(await coreApi("/session")));
      switchWorkspace(value.id);
      form.reset();
    });
  }
  if (session === undefined)
    return (
      <main id="main" className="real-loading">
        <Brand />
        <p>{c.loading}</p>
      </main>
    );
  if (!session)
    return (
      <main id="main" className="real-login">
        <div className="real-login-art">
          <Brand light />
          <span className="eyebrow">{c.eyebrow}</span>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <Link href={settings.routes.home}>
            <ArrowLeft size={16} />
            {c.back}
          </Link>
        </div>
        <div className="real-login-form">
          <h2>{c.loginTitle}</h2>
          <p>{c.loginDescription}</p>
          <form onSubmit={login}>
            <label>
              {c.email}
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                maxLength={254}
              />
            </label>
            <label>
              {c.password}
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={1024}
              />
            </label>
            <button className="button button-dark" disabled={busy}>
              {busy ? c.busy : c.signIn}
              <ArrowUpRight size={18} />
            </button>
          </form>
          {error && (
            <p role="alert" className="real-error">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  const activeCount = tasks.filter((task) =>
    ["queued", "running"].includes(task.status),
  ).length;
  return (
    <div className="real-shell">
      <aside className="real-sidebar">
        <Brand />
        <Link href={settings.routes.home} className="real-back">
          <ArrowLeft size={15} />
          {c.back}
        </Link>
        <label className="real-workspace-label">
          {c.workspace}
          <select
            disabled={busy}
            value={workspace}
            onChange={(event) => {
              closeDetail();
              switchWorkspace(event.target.value);
            }}
          >
            {session.workspaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Operations navigation">
          {c.tabs.map((name, index) => {
            const Icon = [LayoutDashboard, FileText, Network, ShieldCheck][
              index
            ];
            return (
              <button
                key={name}
                aria-current={tab === index ? "page" : undefined}
                onClick={() => setTab(index)}
              >
                <Icon size={18} />
                <span>{name}</span>
              </button>
            );
          })}
        </nav>
        <div className="real-sidebar-bottom">
          <span>{session.email}</span>
          <button
            disabled={busy}
            onClick={() =>
              void action(async () => {
                await coreApi("/logout", {
                  method: "POST",
                  csrf: session.csrf,
                  body: {},
                });
                setSession(null);
                switchWorkspace("");
                closeDetail();
              })
            }
          >
            <LogOut size={16} />
            {c.signOut}
          </button>
        </div>
      </aside>
      <main id="main" className="real-main" key={workspace}>
        <header className="real-heading">
          <div>
            <span className="eyebrow">{c.eyebrow}</span>
            <h1>{c.title}</h1>
            <p>{c.description}</p>
          </div>
          <button
            aria-label={c.refresh}
            className="icon-button"
            onClick={() => void action(refresh)}
            disabled={busy}
          >
            <RefreshCw size={19} />
          </button>
        </header>
        <div aria-live="polite">
          {error && (
            <p role="alert" className="real-error">
              {error}
            </p>
          )}
          {notice && <p className="real-success">{notice}</p>}
        </div>
        {tab === 0 && (
          <>
            <div className="real-metrics">
              {[
                [String(tasks.length), c.metricLabels[0]],
                [String(activeCount), c.metricLabels[1]],
                [
                  String(tasks.filter((t) => t.status === "approval").length),
                  c.metricLabels[2],
                ],
                [
                  String(tasks.filter((t) => t.status === "completed").length),
                  c.metricLabels[3],
                ],
              ].map(([value, label]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value.padStart(2, "0")}</strong>
                </div>
              ))}
            </div>
            <section className="real-card">
              <h2>{c.newTask}</h2>
              <p className="real-muted">{c.taskNotice}</p>
              <form onSubmit={createTask} className="real-form">
                <label className="real-full">
                  {c.request}
                  <textarea
                    name="request"
                    required
                    minLength={10}
                    maxLength={capabilities?.limits.requestChars}
                    rows={3}
                  />
                </label>
                <label>
                  {c.client}
                  <input name="client" required maxLength={120} />
                </label>
                <label>
                  {c.recipient}
                  <input
                    name="recipient"
                    type="email"
                    required
                    maxLength={254}
                  />
                </label>
                <fieldset className="real-full">
                  <legend>{c.evidence}</legend>
                  {documents.length ? (
                    documents.map((document) => (
                      <label className="real-checkbox" key={document.id}>
                        <input
                          type="checkbox"
                          name="document_ids"
                          value={document.id}
                        />
                        <span>
                          {document.title}
                          <small>
                            v{document.version} · {document.source}
                          </small>
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="real-muted">{c.emptyKnowledge}</p>
                  )}
                </fieldset>
                <button
                  className="button button-dark"
                  disabled={busy || !documents.length}
                >
                  {busy ? c.busy : c.submitTask}
                  <ArrowUpRight size={17} />
                </button>
              </form>
            </section>
            <section className="real-card">
              <div className="real-section-top">
                <h2>{c.queueTitle}</h2>
                <span>{c.roles}</span>
              </div>
              {tasks.length ? (
                <div className="real-task-list">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => void openTask(task.id)}
                      className="real-task-row"
                      disabled={busy}
                    >
                      <span>
                        <strong>{task.request.client}</strong>
                        <small>{task.request.request}</small>
                      </span>
                      <span
                        className={`real-status real-status-${task.status}`}
                      >
                        {c.taskStatuses[task.status]}
                      </span>
                      <ArrowUpRight size={18} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="real-empty">{c.emptyTasks}</p>
              )}
            </section>
          </>
        )}
        {tab === 1 && (
          <>
            <section className="real-card">
              <h2>{c.knowledgeTitle}</h2>
              <p className="real-muted">{c.knowledgeDescription}</p>
              <form onSubmit={saveDocument} className="real-form">
                <label>
                  {c.documentTitle}
                  <input name="title" required maxLength={160} />
                </label>
                <label>
                  {c.documentSource}
                  <input name="source" required maxLength={500} />
                </label>
                <label className="real-full">
                  {c.documentText}
                  <textarea
                    name="content"
                    required
                    minLength={20}
                    maxLength={capabilities?.limits.documentChars}
                    rows={8}
                  />
                </label>
                <button className="button button-dark" disabled={busy}>
                  {c.saveDocument}
                  <ArrowUpRight size={17} />
                </button>
              </form>
            </section>
            <section className="real-card">
              {documents.length ? (
                documents.map((document) => (
                  <article key={document.id} className="real-document">
                    <div className="real-section-top">
                      <h3>{document.title}</h3>
                      <span>v{document.version}</span>
                    </div>
                    <p className="real-small">{document.source}</p>
                    <p className="real-preformatted">{document.content}</p>
                    <code className="real-hash">{document.content_hash}</code>
                    <button
                      className="real-text-button"
                      disabled={busy}
                      onClick={() =>
                        void action(async () => {
                          await coreApi(
                            `/workspaces/${workspace}/documents/${document.id}`,
                            { method: "DELETE", csrf: session.csrf },
                          );
                          await refresh();
                        })
                      }
                    >
                      {c.deleteDocument}
                    </button>
                  </article>
                ))
              ) : (
                <p className="real-empty">{c.emptyKnowledge}</p>
              )}
            </section>
          </>
        )}
        {tab === 2 && (
          <>
            <section className="real-card">
              <h2>{c.memoryTitle}</h2>
              <h3>{c.episodes}</h3>
              {memory.episodes.length ? (
                memory.episodes.map((item) => (
                  <article className="real-memory-item" key={item.id}>
                    <p>{item.summary}</p>
                    <time>{new Date(item.created_at).toLocaleString()}</time>
                  </article>
                ))
              ) : (
                <p className="real-empty">{c.emptyMemory}</p>
              )}
            </section>
            <section className="real-card">
              <h2>{c.commitments}</h2>
              {memory.commitments.map((item) => (
                <p key={item.id} className="real-memory-item">
                  {item.description}
                </p>
              ))}
            </section>
          </>
        )}
        {tab === 3 && (
          <>
            <section className="real-card">
              <h2>{c.connectionsTitle}</h2>
              <p>{c.connectionsNotice}</p>
              {capabilities && (
                <>
                  <div className="real-connection">
                    <strong>{c.localOnly}</strong>
                    <span>
                      {capabilities.model} ·{" "}
                      {capabilities.model_available
                        ? c.modelAvailable
                        : c.modelUnavailable}
                    </span>
                  </div>
                  {Object.entries(capabilities.connectors).map(
                    ([name, status]) => (
                      <div className="real-connection" key={name}>
                        <strong>{name}</strong>
                        <span>{status}</span>
                      </div>
                    ),
                  )}
                  <p className="real-small">
                    {capabilities.engine} · {capabilities.revision}
                  </p>
                </>
              )}
            </section>
            <section className="real-card">
              <h2>{c.newWorkspace}</h2>
              <form onSubmit={createWorkspace} className="real-form">
                <label>
                  {c.workspaceName}
                  <input name="name" required minLength={2} maxLength={80} />
                </label>
                <button className="button button-dark" disabled={busy}>
                  {c.createWorkspace}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
      <TaskDialog
        detail={detail}
        onClose={closeDetail}
        onDecision={(decision) => void decide(decision)}
        onCancel={() => void cancelTask()}
        busy={busy}
      />
    </div>
  );
}
