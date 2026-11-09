import { FileText, Image, Paperclip, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dateControlEntriesApi } from "../../../api/client";
import type { DateControlEntryAttachment } from "../../../types";
import "./EntryAttachments.css";

// Mirrors the backend's allow-list/limit (DateControlEntryService) so the user gets the error
// before uploading 10+ MB over mobile data.
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";
const MAX_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validate(files: File[]): string | null {
  const tooBig = files.find((f) => f.size > MAX_BYTES);
  return tooBig ? `"${tooBig.name}" passa de 10 MB.` : null;
}

function FileIcon({ contentType }: { contentType: string }) {
  return contentType.startsWith("image/") ? (
    <Image size={15} strokeWidth={2} />
  ) : (
    <FileText size={15} strokeWidth={2} />
  );
}

function PickButton({ onPick, disabled }: { onPick: (files: File[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          onPick(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        className="btn btn--outline attachments__add"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip size={14} strokeWidth={2} />
        Anexar comprovante
      </button>
    </>
  );
}

/** Before the entry exists (create modal): files are held by the parent and uploaded after save. */
export function PendingAttachments({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="field">
      <span className="field__label">Comprovantes</span>
      {files.length > 0 && (
        <ul className="attachments__list">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="attachments__item">
              <FileIcon contentType={file.type} />
              <span className="attachments__name">{file.name}</span>
              <span className="attachments__size">{formatSize(file.size)}</span>
              <button
                type="button"
                className="attachments__remove"
                aria-label={`Remover ${file.name}`}
                onClick={() => onChange(files.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <PickButton
        onPick={(picked) => {
          const problem = validate(picked);
          setError(problem);
          if (!problem) onChange([...files, ...picked]);
        }}
      />
      <span className="attachments__hint">PDF ou imagem, até 10 MB cada.</span>
      {error && <span className="attachments__error">{error}</span>}
    </div>
  );
}

/** Existing entry (edit modal): uploads/removals hit the API immediately. */
export function EntryAttachments({
  moduleId,
  entryId,
  onChanged,
}: {
  moduleId: string;
  entryId: string;
  /** So the table's attachment count refreshes even if the modal is cancelled afterwards. */
  onChanged: () => void;
}) {
  const [attachments, setAttachments] = useState<DateControlEntryAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dateControlEntriesApi
      .listAttachments(moduleId, entryId)
      .then(setAttachments)
      .catch(() => setError("Não foi possível carregar os anexos."))
      .finally(() => setLoading(false));
  }, [moduleId, entryId]);

  async function upload(files: File[]) {
    const problem = validate(files);
    setError(problem);
    if (problem) return;

    setUploading(true);
    try {
      for (const file of files) {
        const created = await dateControlEntriesApi.uploadAttachment(moduleId, entryId, file);
        setAttachments((prev) => [...prev, created]);
      }
      onChanged();
    } catch {
      setError("Não foi possível enviar o arquivo. Use PDF ou imagem de até 10 MB.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(attachment: DateControlEntryAttachment) {
    try {
      await dateControlEntriesApi.removeAttachment(moduleId, entryId, attachment.id);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      onChanged();
    } catch {
      setError("Não foi possível remover o anexo.");
    }
  }

  return (
    <div className="field">
      <span className="field__label">Comprovantes</span>
      {loading ? (
        <span className="attachments__hint">Carregando anexos…</span>
      ) : (
        attachments.length > 0 && (
          <ul className="attachments__list">
            {attachments.map((a) => (
              <li key={a.id} className="attachments__item">
                <FileIcon contentType={a.contentType} />
                <a
                  className="attachments__name attachments__name--link"
                  href={dateControlEntriesApi.attachmentUrl(moduleId, entryId, a.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {a.fileName}
                </a>
                <span className="attachments__size">{formatSize(a.sizeBytes)}</span>
                <button
                  type="button"
                  className="attachments__remove"
                  aria-label={`Remover ${a.fileName}`}
                  onClick={() => remove(a)}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )
      )}
      <PickButton onPick={upload} disabled={uploading} />
      <span className="attachments__hint">
        {uploading ? "Enviando…" : "PDF ou imagem, até 10 MB cada. Salvo na hora."}
      </span>
      {error && <span className="attachments__error">{error}</span>}
    </div>
  );
}
