"use client";

export type AppDialogRequest = {
  id: number;
  kind: "confirm" | "prompt";
  message: string;
  initialValue?: string;
  resolve: (value: boolean | string | null) => void;
};

let nextId = 0;

function requestDialog(
  request: Omit<AppDialogRequest, "id" | "resolve">
): Promise<boolean | string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    window.dispatchEvent(
      new CustomEvent<AppDialogRequest>("mai:app-dialog", {
        detail: { ...request, id: ++nextId, resolve },
      })
    );
  });
}

export async function confirmInApp(message: string): Promise<boolean> {
  return (await requestDialog({ kind: "confirm", message })) === true;
}

export async function promptInApp(
  message: string,
  initialValue = ""
): Promise<string | null> {
  const result = await requestDialog({ initialValue, kind: "prompt", message });
  return typeof result === "string" ? result : null;
}
