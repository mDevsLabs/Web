import { Fragment } from "react";

export function EditorFileBreadcrumb({ filePath }: { filePath: string }) {
  const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
  return (
    <div aria-label={filePath} className="ref-editor-breadcrumb-inner">
      {parts.map((p, i) => (
        <Fragment key={`${i}-${p}`}>
          {i > 0 ? (
            <span aria-hidden className="ref-editor-bc-sep">
              ›
            </span>
          ) : null}
          <span
            className={
              i === parts.length - 1
                ? "ref-editor-bc-current"
                : "ref-editor-bc-part"
            }
          >
            {p}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
