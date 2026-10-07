"use client";

import { useRef, useState, useTransition } from "react";
import { Send, Loader2, Paperclip, X, FileText } from "lucide-react";
import { adminReply } from "../actions";

export function AdminReplyComposer({ threadId }: { threadId: string }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const combined = [...files, ...Array.from(selected)].slice(0, 3);
    for (const f of combined) {
      if (f.size > 10 * 1024 * 1024) {
        setError(`${f.name} is over 10 MB.`);
        return;
      }
    }
    setError(null);
    setFiles(combined);
  }

  async function uploadFiles() {
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("threadId", threadId);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = body.trim();
    if (!text && files.length === 0) return;
    setError(null);

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("body", text || "(attachment)");
        await adminReply(threadId, fd);
        if (files.length > 0) {
          await uploadFiles();
        }
        setBody("");
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not send");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-gray-200 bg-white p-4">
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-gray-100 rounded-md text-xs text-gray-700"
            >
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[160px]">{f.name}</span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${f.name}`}
                className="p-0.5 text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <label className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 cursor-pointer rounded-md hover:bg-gray-100">
          <Paperclip className="h-5 w-5" />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => addFiles(e.target.files)}
          />
          <span className="sr-only">Attach files</span>
        </label>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          placeholder="Reply as EII Team… (Cmd/Ctrl+Enter to send)"
          rows={2}
          className="flex-1 resize-none max-h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />

        <button
          type="submit"
          disabled={isPending || (!body.trim() && files.length === 0)}
          className="flex-shrink-0 inline-flex items-center justify-center h-10 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-1.5" />
              Send
            </>
          )}
        </button>
      </div>
    </form>
  );
}
