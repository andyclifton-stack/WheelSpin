import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Layers,
  ListPlus,
  Save,
  FolderOpen,
  Undo2,
} from "lucide-react";
import { COLORS, makeId, MAX_ITEMS } from "../utils/model";
import "./Sidebar.css";
function EntryName({ item, index, onChange }) {
  const [draft, setDraft] = useState(item.name);
  const commit = () => {
    if (draft.trim()) onChange(draft.trim());
    else setDraft(item.name);
  };
  return (
    <input
      aria-label={`Entry ${index + 1} name`}
      className="entry-name"
      maxLength={120}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(item.name);
        }
      }}
    />
  );
}
export default function Sidebar({
  state,
  mutate,
  disabled,
  openModal,
  canUndo,
  undo,
  onDone,
}) {
  const [newName, setNewName] = useState("");
  const { items } = state;
  const add = (event) => {
    event.preventDefault();
    if (!newName.trim() || items.length >= MAX_ITEMS) return;
    mutate(
      {
        items: [
          ...items,
          {
            id: makeId(),
            name: newName.trim(),
            color: COLORS[items.length % COLORS.length],
          },
        ],
      },
      "Entry added.",
    );
    setNewName("");
  };
  return (
    <div className="sidebar">
      <div className="sidebar-heading">
        <div>
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2>Wheel entries</h2>
        </div>
        <span className="count">{items.length}/50</span>
      </div>
      <fieldset disabled={disabled}>
        <button className="new-wheel-button" onClick={() => openModal("new")}>
          <Plus size={16} />
          New wheel
        </button>
        <label className="field-label" htmlFor="wheel-title">
          Wheel name
        </label>
        <input
          id="wheel-title"
          className="title-input"
          value={state.title}
          maxLength={80}
          onChange={(event) => mutate({ title: event.target.value }, "", false)}
          onBlur={() => {
            if (!state.title.trim()) mutate({ title: "My wheel" }, "", false);
          }}
        />
        <div className="editor-tools">
          <button onClick={() => openModal("templates")}>
            <Layers size={16} />
            Templates
          </button>
          <button onClick={() => openModal("bulk")}>
            <ListPlus size={16} />
            Paste a list
          </button>
        </div>
        <form className="add-form" onSubmit={add}>
          <label className="sr-only" htmlFor="new-entry">
            New entry
          </label>
          <input
            id="new-entry"
            placeholder="Add an entry…"
            maxLength={120}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
          />
          <button
            type="submit"
            className="add-button"
            aria-label="Add entry"
            disabled={!newName.trim() || items.length >= MAX_ITEMS}
          >
            <Plus size={20} />
          </button>
        </form>
        <p className="editor-hint">
          {items.length === 50
            ? "50-entry limit reached."
            : "Edit a name or colour directly below."}
        </p>
        <div className="items-list">
          {items.map((item, index) => (
            <div key={item.id} className="item-row">
              <span className="entry-number">{index + 1}</span>
              <input
                type="color"
                value={item.color}
                aria-label={`Entry ${index + 1} colour`}
                onChange={(event) =>
                  mutate(
                    {
                      items: items.map((row) =>
                        row.id === item.id
                          ? { ...row, color: event.target.value }
                          : row,
                      ),
                    },
                    "",
                    false,
                  )
                }
              />
              <EntryName
                key={item.name + item.id}
                item={item}
                index={index}
                onChange={(name) => {
                  if (name !== item.name)
                    mutate(
                      {
                        items: items.map((row) =>
                          row.id === item.id ? { ...row, name } : row,
                        ),
                      },
                      "Entry updated.",
                    );
                }}
              />
              <button
                className="icon-button remove-entry"
                aria-label={`Remove entry ${index + 1}: ${item.name}`}
                onClick={() =>
                  mutate(
                    { items: items.filter((row) => row.id !== item.id) },
                    "Entry removed. Undo is available.",
                  )
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        {!items.length && (
          <div className="empty-editor">
            Your wheel is empty. Add an entry or choose a template to get
            started.
          </div>
        )}
        <div className="editor-footer">
          <button disabled={!items.length} onClick={() => openModal("save")}>
            <Save size={16} />
            Save as template
          </button>
          <button onClick={() => openModal("saved")}>
            <FolderOpen size={16} />
            My templates
          </button>
          <button disabled={!canUndo} onClick={undo}>
            <Undo2 size={16} />
            Undo
          </button>
        </div>
      </fieldset>
      <p className="local-note">Save as template to reuse this wheel. Your templates stay on this browser; use Share to send a copy.</p>
      {onDone && (
        <button className="primary done-button" onClick={onDone}>
          Done editing
        </button>
      )}
    </div>
  );
}
