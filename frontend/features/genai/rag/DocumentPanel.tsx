"use client";

import { useState } from "react";
import { addDocument, deleteDocument, resetDocuments, type RagDocument } from "../api";

export function DocumentPanel({
  documents,
  onChange,
}: {
  documents: RagDocument[];
  onChange: (docs: RagDocument[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !text.trim()) return;
    setAdding(true);
    try {
      const doc = await addDocument(title.trim(), text.trim());
      onChange([...documents, doc]);
      setTitle("");
      setText("");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    onChange(documents.filter((d) => d.id !== id));
  };

  const handleReset = async () => {
    const docs = await resetDocuments();
    onChange(docs);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setExpanded((e) => !e)} className="text-sm text-neutral-400 hover:text-neutral-200">
          {expanded ? "▾" : "▸"} Documents ({documents.length})
        </button>
        <button onClick={handleReset} className="text-xs text-neutral-500 hover:text-neutral-300">
          reset to demo corpus
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border border-neutral-800 rounded-md p-3 bg-neutral-900">
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-start gap-2 text-xs">
                <div className="flex-1">
                  <div className="text-neutral-200 font-medium">{doc.title}</div>
                  <div className="text-neutral-500 truncate">{doc.text.slice(0, 100)}…</div>
                </div>
                <button onClick={() => handleDelete(doc.id)} className="text-neutral-500 hover:text-red-400 px-1">
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-100"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste document text…"
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-100"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !title.trim() || !text.trim()}
              className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs text-neutral-200"
            >
              {adding ? "Adding…" : "Add document"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
