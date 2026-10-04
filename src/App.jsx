import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Pencil,
  Share2,
  Maximize2,
  Minimize2,
  Settings2,
  History,
  RotateCcw,
  Trash2,
  Undo2,
  Check,
  Copy,
  Download,
} from "lucide-react";
import Wheel from "./components/Wheel";
import Sidebar from "./components/Sidebar";
import Modal from "./components/Modal";
import { playTadaSound } from "./utils/audio";
import {
  loadState,
  STORAGE_KEY,
  TEMPLATES,
  makeItems,
  makeId,
  parseShare,
  shareHash,
  MAX_ITEMS,
  resultsCsv,
} from "./utils/model";
import "./App.css";

function App() {
  const [state, setState] = useState(() =>
    loadState({ getItem: (key) => window.localStorage.getItem(key) }),
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const [spinning, setSpinning] = useState(false);
  const spinningRef = useRef(false);
  const [winner, setWinner] = useState(null);
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [isMobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 900px)").matches,
  );
  const [systemMotion, setSystemMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [undoStack, setUndoStack] = useState([]);
  const undoRef = useRef([]);
  undoRef.current = undoStack;
  const [bulk, setBulk] = useState("");
  const [bulkMode, setBulkMode] = useState("append");
  const [template, setTemplate] = useState(0);
  const [saveName, setSaveName] = useState("");
  const [newWheelName, setNewWheelName] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [incoming, setIncoming] = useState(null);
  const [sharedError, setSharedError] = useState("");
  const wheel = useRef(null);
  const reducedMotion = systemMotion || state.settings.reducedMotion;
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 900px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => setMobile(mobile.matches);
    const motionChange = () => setSystemMotion(motion.matches);
    mobile.addEventListener("change", resize);
    motion.addEventListener("change", motionChange);
    return () => {
      mobile.removeEventListener("change", resize);
      motion.removeEventListener("change", motionChange);
    };
  }, []);
  useEffect(() => {
    const read = () => {
      try {
        const value = parseShare(location.hash);
        if (value) {
          setIncoming(value);
          setSharedError("");
          setModal("incoming");
        }
      } catch {
        setSharedError(
          "This shared link is invalid or unsupported. Your current wheel is safe.",
        );
        setIncoming(null);
        setModal("incoming");
      }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    const key = (event) => {
      if (
        event.code === "Space" &&
        !modal &&
        !["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(
          event.target.tagName,
        ) &&
        !event.target.isContentEditable
      ) {
        event.preventDefault();
        wheel.current?.spin();
      }
      if (event.key === "Escape" && !modal) setPresentation(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [modal]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const remember = () => {
    const previous = stateRef.current;
    const next = [
      {
        title: previous.title,
        items: previous.items.map((row) => ({ ...row })),
        history: [...previous.history],
        saved: previous.saved.map((row) => ({
          ...row,
          items: row.items.map((item) => ({ ...item })),
        })),
      },
      ...undoRef.current,
    ].slice(0, 25);
    undoRef.current = next;
    setUndoStack(next);
  };
  const mutate = (patch, message = "", record = true) => {
    if (spinningRef.current) return;
    if (record) remember();
    setState((previous) => ({ ...previous, ...patch }));
    if (patch.items || patch.title) setWinner(null);
    if (message) setNotice(message);
  };
  const undo = () => {
    if (spinningRef.current || !undoRef.current.length) return;
    const [previous, ...rest] = undoRef.current;
    setState((current) => ({ ...current, ...previous }));
    undoRef.current = rest;
    setUndoStack(rest);
    setWinner(null);
    setNotice("Last action undone.");
  };
  const openModal = (name) => {
    if (spinningRef.current) return;
    setDialogMessage("");
    if (name === "new") setNewWheelName("");
    if (name === "save") setSaveName(stateRef.current.title || "My wheel");
    if (name === "share") {
      try {
        setShareUrl(
          location.origin + location.pathname + shareHash(stateRef.current),
        );
      } catch (error) {
        setNotice(error.message);
        return;
      }
    }
    setModal(name);
  };
  const closeModal = () => {
    if (modal === "incoming")
      history.replaceState(null, "", location.pathname + location.search);
    setModal(null);
    setDialogMessage("");
  };
  const start = () => {
    spinningRef.current = true;
    setSpinning(true);
    setWinner(null);
    setNotice("");
  };
  const complete = (item, angle, count) => {
    remember();
    const previous = stateRef.current;
    const removed = previous.settings.removeAfter;
    setState((current) => ({
      ...current,
      items: removed
        ? current.items.filter((row) => row.id !== item.id)
        : current.items,
      history: [
        {
          id: makeId(),
          name: item.name,
          title: current.title,
          color: item.color,
          time: Date.now(),
          count,
          angle,
        },
        ...current.history,
      ].slice(0, 50),
    }));
    setWinner({ ...item, removed, angle, count });
    spinningRef.current = false;
    setSpinning(false);
    if (previous.settings.sound) playTadaSound();
    if (!reducedMotion)
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a7c7ee", "#edc570", "#e66e78", "#69bd9b"],
        disableForReducedMotion: true,
      });
  };
  const removeWinner = () => {
    if (!winner || spinningRef.current) return;
    const chosen = winner;
    mutate(
      { items: state.items.filter((row) => row.id !== chosen.id) },
      "Winner removed. Undo is available.",
    );
    setWinner({ ...chosen, removed: true });
  };
  const sidebarProps = {
    state,
    mutate,
    disabled: spinning,
    openModal,
    canUndo: !!undoStack.length,
    undo,
  };
  const lines = bulk
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);
  const bulkCount =
    lines.length + (bulkMode === "append" ? state.items.length : 0);
  const bulkError = !lines.length
    ? "Paste at least one entry."
    : lines.some((name) => name.length > 120)
      ? "Keep each entry to 120 characters or fewer."
      : bulkCount > MAX_ITEMS
        ? "Your wheel can have up to 50 entries. Choose Replace or shorten the list."
        : "";
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setDialogMessage("Link copied.");
    } catch {
      setDialogMessage(
        "Copy is unavailable here. Select the link below and copy it manually.",
      );
    }
  };
  const shareWheel = async () => {
    try {
      await navigator.share({ title: state.title, url: shareUrl });
      setDialogMessage("Wheel shared.");
    } catch (error) {
      if (error.name !== "AbortError") {
        setDialogMessage("Sharing is unavailable here. Use WhatsApp or Copy link below.");
      }
    }
  };
  return (
    <div
      className={`app-layout ${presentation ? "presentation" : ""} ${reducedMotion ? "reduce-motion" : ""}`}
    >
      {!presentation && !isMobile && (
        <aside className="sidebar-container" aria-label="Wheel editor">
          <Sidebar {...sidebarProps} />
        </aside>
      )}
      <main className="main-content" id="main">
        <nav className="topbar" aria-label="Wheel controls">
          <a className="hub-link" href="/FingerOfShame/">
            <ArrowLeft size={16} />
            <span>Finger Game</span>
          </a>
          <div className="topbar-actions">
            <button
              className="mobile-edit"
              onClick={() => openModal("editor")}
              disabled={spinning}
            >
              <Pencil size={16} />
              Edit wheel
            </button>
            <button
              aria-label="Share wheel"
              onClick={() => openModal("share")}
              disabled={spinning || !state.items.length}
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button
              aria-label={
                presentation
                  ? "Exit presentation mode"
                  : "Enter presentation mode"
              }
              onClick={() => setPresentation(!presentation)}
            >
              {presentation ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              <span>{presentation ? "Exit" : "Present"}</span>
            </button>
          </div>
        </nav>
        <header className="header">
          <p className="eyebrow">A LITTLE SPIN. A CLEAR DECISION.</p>
          <h1>
            WheelSpin<span>.</span>
          </h1>
          <p>Make a choice. Pick a name. Get things moving.</p>
        </header>
        <section className="wheel-section" aria-label="Spin your wheel">
          <div className="wheel-caption">
            <h2>{state.title.trim() || "My wheel"}</h2>
            <span className="choice-count">
              {state.items.length}{" "}
              {state.items.length === 1 ? "entry" : "entries"}{" "}
              <span aria-hidden="true">·</span> Equal chance
            </span>
          </div>
          <Wheel
            ref={wheel}
            items={state.items}
            winnerId={winner?.id}
            settings={state.settings}
            reducedMotion={reducedMotion}
            onStart={start}
            onComplete={complete}
            spinning={spinning}
            onEmpty={() => openModal("editor")}
          />
          <p className="spin-hint">
            {spinning
              ? "Finding your next choice…"
              : !state.items.length
                ? "Add entries to get started."
                : state.items.length > 18
                  ? "Numbers on the wheel match the numbered entries."
                  : "Tap the centre to spin, or press Space."}
          </p>
          {state.items.length > 18 && (
            <button className="entry-key" onClick={() => openModal("entries")}>
              View numbered entries
            </button>
          )}
          <div
            className={`result-card ${winner ? "has-result" : ""}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {winner ? (
              <>
                <div className="result-heading">
                  <span
                    className="result-marker"
                    style={{ background: winner.color }}
                  />
                  <div>
                    <p className="eyebrow">THE WHEEL CHOSE</p>
                    <h3>{winner.name}</h3>
                  </div>
                  <Check size={22} className="result-check" />
                </div>
                {winner.removed && (
                  <p className="removed-note">
                    Removed from this wheel. Undo to restore it.
                  </p>
                )}
                <div className="result-actions">
                  <button
                    onClick={() => wheel.current?.spin()}
                    disabled={spinning || !state.items.length}
                  >
                    <RotateCcw size={16} />
                    Spin again
                  </button>
                  <button
                    onClick={removeWinner}
                    disabled={spinning || winner.removed}
                  >
                    <Trash2 size={16} />
                    Remove winner
                  </button>
                  <button
                    onClick={undo}
                    disabled={spinning || !undoStack.length}
                  >
                    <Undo2 size={16} />
                    Undo
                  </button>
                </div>
              </>
            ) : (
              <p className="ready-message">
                {spinning
                  ? "A moment of suspense…"
                  : state.items.length
                    ? "Your next choice starts here."
                    : "A blank wheel. Endless possibilities."}
              </p>
            )}
          </div>
          <div className="session-tools">
            <button onClick={() => openModal("history")} disabled={spinning}>
              <History size={16} />
              Results{" "}
              {state.history.length > 0 && (
                <span className="tiny-count">{state.history.length}</span>
              )}
            </button>
            <button onClick={() => openModal("settings")} disabled={spinning}>
              <Settings2 size={16} />
              Options
            </button>
            <span className="sound-state">
              Sound {state.settings.sound ? "on" : "off"}
            </span>
          </div>
        </section>
        <div className="notice" role="status">
          {notice}
        </div>
        {storageError && (
          <p className="storage-warning" role="alert">
            Browser storage is unavailable. This session still works, but
            changes will not survive a reload. Use Share to keep a copy of your
            wheel.
          </p>
        )}
        <footer className="page-footer">
          Made for decisions, big and small.<span>WheelSpin · Finger Game</span>
        </footer>
      </main>
      {modal && (
        <Modal
          key={modal}
          title={
            {
              editor: "Edit your wheel",
              new: "Create a new wheel",
              templates: "Choose a template",
              bulk: "Paste your entries",
              save: "Save as template",
              saved: "My templates",
              share: "Share your wheel",
              history: "Recent results",
              settings: "Wheel options",
              incoming: "A wheel was shared with you",
              entries: "Numbered entries",
            }[modal]
          }
          onClose={closeModal}
          className={modal === "editor" ? "editor-modal" : ""}
        >
          {modal === "editor" && (
            <Sidebar {...sidebarProps} onDone={closeModal} />
          )}
          {modal === "new" && (
            <form onSubmit={(event) => {
              event.preventDefault();
              if (!newWheelName.trim()) return;
              mutate({ title: newWheelName.trim(), items: [] }, "New wheel created. Add your entries, then Save as template to reuse it. Undo restores your previous wheel.");
              if (isMobile) setModal("editor");
              else closeModal();
            }}>
              <p className="dialog-intro">Start with a blank wheel. Add your own entries or paste a list, then save it as a reusable template.</p>
              <label className="field-label" htmlFor="new-wheel-name">New wheel name</label>
              <input id="new-wheel-name" maxLength={80} value={newWheelName} onChange={(event) => setNewWheelName(event.target.value)} placeholder="e.g. Friday challenges" />
              <p className="dialog-note">Your saved templates are kept. Undo can restore the wheel you were editing.</p>
              <button type="submit" className="primary dialog-primary" disabled={!newWheelName.trim()}>Create blank wheel</button>
            </form>
          )}
          {modal === "templates" && (
            <>
              <p className="dialog-intro">
                Start with a ready-made list, create a blank wheel, or open one of your own templates.
              </p>
              <div className="dialog-actions">
                <button onClick={() => openModal("new")}>New wheel</button>
                <button onClick={() => openModal("saved")}>My templates ({state.saved.length})</button>
              </div>
              <div className="template-grid">
                {TEMPLATES.map((row, index) => (
                  <button
                    key={row.title}
                    aria-pressed={template === index}
                    className={template === index ? "selected" : ""}
                    onClick={() => setTemplate(index)}
                  >
                    <strong>{row.title}</strong>
                    <span>{row.description}</span>
                  </button>
                ))}
              </div>
              <div className="template-preview">
                <p className="field-label">
                  Preview · {TEMPLATES[template].names.length} entries
                </p>
                <div className="preview-tags">
                  {TEMPLATES[template].names.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </div>
              </div>
              <p className="dialog-note">
                Using a template replaces your current entries. Undo can restore
                them.
              </p>
              <button
                className="primary"
                onClick={() => {
                  mutate(
                    {
                      title: TEMPLATES[template].title,
                      items: makeItems(TEMPLATES[template].names),
                    },
                    "Template applied.",
                  );
                  closeModal();
                }}
              >
                Use this template
              </button>
            </>
          )}
          {modal === "bulk" && (
            <>
              <p className="dialog-intro">
                One entry per line. Blank lines are ignored. Repeated names stay
                as separate entries.
              </p>
              <label htmlFor="bulk-list" className="field-label">
                Your list
              </label>
              <textarea
                id="bulk-list"
                rows={8}
                maxLength={10000}
                placeholder={"Alex\nSam\nTaylor"}
                value={bulk}
                onChange={(event) => setBulk(event.target.value)}
              />
              <div className="radio-row">
                <label>
                  <input
                    type="radio"
                    name="bulk-mode"
                    checked={bulkMode === "append"}
                    onChange={() => setBulkMode("append")}
                  />
                  Add to existing entries
                </label>
                <label>
                  <input
                    type="radio"
                    name="bulk-mode"
                    checked={bulkMode === "replace"}
                    onChange={() => setBulkMode("replace")}
                  />
                  Replace current entries
                </label>
              </div>
              <p className="dialog-note" aria-live="polite">
                {lines.length} pasted · {bulkCount} total.{" "}
                {lines.length > 0 && bulkError}
              </p>
              <button
                className="primary"
                disabled={!!bulkError}
                onClick={() => {
                  mutate(
                    {
                      items: [
                        ...(bulkMode === "append" ? state.items : []),
                        ...makeItems(lines),
                      ],
                    },
                    "List added. Undo is available.",
                  );
                  setBulk("");
                  closeModal();
                }}
              >
                Apply list
              </button>
            </>
          )}
          {modal === "save" && (
            <>
              <p className="dialog-intro">
                Keep this wheel as a reusable template in My templates.
                You can save up to 20 on this browser. Use Share to send a copy to another device.
              </p>
              <label className="field-label" htmlFor="save-name">
                Template name
              </label>
              <input
                id="save-name"
                maxLength={80}
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
              />
              <button
                className="primary dialog-primary"
                disabled={!saveName.trim() || !state.items.length || state.saved.length >= 20}
                onClick={() => {
                  mutate(
                    {
                      saved: [
                        {
                          id: makeId(),
                          title: saveName.trim(),
                          items: state.items.map((row) => ({ ...row })),
                        },
                        ...state.saved,
                      ],
                    },
                    "Template saved to My templates.",
                  );
                  closeModal();
                }}
              >
                Save template
              </button>
              {state.saved.length >= 20 && (
                <p role="alert">
                  Your library is full. Remove a saved wheel to make room.
                </p>
              )}
            </>
          )}
          {modal === "saved" && (
            <>
              <p className="dialog-intro">
                Your reusable templates on this browser, including any wheels you previously saved. Loading one replaces the current list; Undo can restore it.
              </p>
              {!state.saved.length ? (
                <p className="empty-message">
                  No templates saved yet. Choose New wheel, add your entries, then Save as template in the editor.
                </p>
              ) : (
                <div className="saved-list">
                  {state.saved.map((row) => (
                    <div key={row.id} className="saved-row">
                      <div>
                        <strong>{row.title}</strong>
                        <span>{row.items.length} entries</span>
                      </div>
                      <button
                        onClick={() => {
                          mutate(
                            {
                              title: row.title,
                              items: row.items.map((item) => ({ ...item })),
                            },
                            "Saved wheel loaded.",
                          );
                          closeModal();
                        }}
                      >
                        Load
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete saved wheel: ${row.title}`}
                        onClick={() =>
                          mutate(
                            {
                              saved: state.saved.filter(
                                (item) => item.id !== row.id,
                              ),
                            },
                            "Saved wheel removed. Undo is available.",
                          )
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {modal === "share" && (
            <>
              <p className="dialog-intro">
                Send your custom wheel to anyone, on any device. They can open
                the link, preview your entries and choose Open this wheel to play.
              </p>
              <label htmlFor="share-link" className="field-label">
                Wheel link
              </label>
              <textarea
                id="share-link"
                rows={3}
                readOnly
                value={shareUrl}
                onFocus={(event) => event.target.select()}
              />
              <p className="dialog-note">
                The link includes your wheel name, entries and colours. Anyone
                with it can open a copy, without an account. Later edits need a
                new link; results and saved wheels stay on this browser.
              </p>
              <div className="dialog-actions">
                <a
                  className="share-whatsapp"
                  href={`https://wa.me/?text=${encodeURIComponent(`Try my wheel: ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 size={16} />
                  Share on WhatsApp
                </a>
                <button className="primary" onClick={copyLink}>
                  <Copy size={16} />
                  Copy link
                </button>
                {typeof navigator.share === "function" && (
                  <button onClick={shareWheel}>
                    <Share2 size={16} />
                    More sharing options
                  </button>
                )}
              </div>
              <p className="dialog-message" role="status">
                {dialogMessage}
              </p>
            </>
          )}
          {modal === "history" && (
            <>
              <p className="dialog-intro">
                The latest 50 results on this browser, newest first.
              </p>
              {!state.history.length ? (
                <div>
                  <p className="empty-message">
                    Spin the wheel to start your results.
                  </p>
                  <button disabled={!undoStack.length} onClick={undo}>
                    <Undo2 size={16} />
                    Undo last action
                  </button>
                </div>
              ) : (
                <>
                  <div className="history-list">
                    {state.history.map((row, index) => (
                      <div className="history-row" key={row.id || index}>
                        <span
                          className="result-marker"
                          style={{
                            background: /^#[0-9a-f]{6}$/i.test(row.color)
                              ? row.color
                              : "#6a9de0",
                          }}
                        />
                        <div>
                          <strong>{row.name}</strong>
                          <span>
                            {row.title} ·{" "}
                            {new Date(row.time).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dialog-actions">
                    <a
                      className="button-link"
                      href={
                        "data:text/csv;charset=utf-8," +
                        encodeURIComponent(resultsCsv(state.history))
                      }
                      download="wheelspin-results.csv"
                    >
                      <Download size={16} />
                      Export CSV
                    </a>
                    <button
                      onClick={() =>
                        mutate(
                          { history: [] },
                          "Results cleared. Undo is available.",
                        )
                      }
                    >
                      <Trash2 size={16} />
                      Clear results
                    </button>
                    <button disabled={!undoStack.length} onClick={undo}>
                      <Undo2 size={16} />
                      Undo
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          {modal === "settings" && (
            <>
              <p className="dialog-intro">
                Every entry has an equal chance. Repeated names have one chance
                per entry.
              </p>
              <div className="options-list">
                <label>
                  <div>
                    <strong>Sound effects</strong>
                    <span>Pointer ticks and a short winner sound.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.sound}
                    onChange={(event) =>
                      mutate(
                        {
                          settings: {
                            ...state.settings,
                            sound: event.target.checked,
                          },
                        },
                        "",
                        false,
                      )
                    }
                  />
                </label>
                <label>
                  <div>
                    <strong>Remove winner automatically</strong>
                    <span>
                      Draw without repeats. Undo restores a selection.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.removeAfter}
                    onChange={(event) =>
                      mutate(
                        {
                          settings: {
                            ...state.settings,
                            removeAfter: event.target.checked,
                          },
                        },
                        "",
                        false,
                      )
                    }
                  />
                </label>
                <label>
                  <div>
                    <strong>Reduced motion</strong>
                    <span>
                      Quick selection, with no confetti or pointer animation.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.reducedMotion}
                    onChange={(event) =>
                      mutate(
                        {
                          settings: {
                            ...state.settings,
                            reducedMotion: event.target.checked,
                          },
                        },
                        "",
                        false,
                      )
                    }
                  />
                </label>
                <label className="duration-option">
                  <div>
                    <strong>Spin duration</strong>
                    <span>
                      {systemMotion
                        ? "Your device requests reduced motion; spins use a quick reveal."
                        : "Choose how much suspense you want."}
                    </span>
                  </div>
                  <select
                    aria-label="Spin duration"
                    value={state.settings.duration}
                    onChange={(event) =>
                      mutate(
                        {
                          settings: {
                            ...state.settings,
                            duration: Number(event.target.value),
                          },
                        },
                        "",
                        false,
                      )
                    }
                  >
                    <option value={3}>Quick · 3s</option>
                    <option value={4.5}>Classic · 4.5s</option>
                    <option value={6}>Suspense · 6s</option>
                  </select>
                </label>
              </div>
              <button className="primary" onClick={closeModal}>
                Done
              </button>
            </>
          )}
          {modal === "incoming" && (
            <>
              {sharedError ? (
                <p role="alert">{sharedError}</p>
              ) : (
                incoming && (
                  <>
                    <p className="dialog-intro">
                      Preview this shared wheel before replacing your current
                      entries.
                    </p>
                    <h3>{incoming.title}</h3>
                    <div className="preview-tags">
                      {incoming.items.map((item, index) => (
                        <span key={index}>{item.name}</span>
                      ))}
                    </div>
                    <p className="dialog-note">
                      Your current wheel can be restored with Undo.
                    </p>
                    <button
                      className="primary"
                      onClick={() => {
                        mutate(
                          { title: incoming.title, items: incoming.items },
                          "Shared wheel opened.",
                        );
                        history.replaceState(
                          null,
                          "",
                          location.pathname + location.search,
                        );
                        closeModal();
                      }}
                    >
                      Open this wheel
                    </button>
                  </>
                )
              )}
            </>
          )}
          {modal === "entries" && (
            <ol className="numbered-list">
              {state.items.map((item) => (
                <li key={item.id}>
                  <span
                    style={{ background: item.color }}
                    className="result-marker"
                  />
                  {item.name}
                </li>
              ))}
            </ol>
          )}
        </Modal>
      )}
    </div>
  );
}
export default App;
