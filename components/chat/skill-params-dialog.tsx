"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Skill } from "@/lib/db/schema";

export function SkillParamsDialog({
  onOpenChange,
  onSubmit,
  open,
  skill,
}: {
  skill: Skill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, string>) => void;
}) {
  const parameters = useMemo(
    () =>
      Array.isArray((skill as any)?.parameters)
        ? (
            (skill as any).parameters as Array<{
              defaultValue?: string;
              description?: string;
              enumValues?: string[];
              name: string;
              required?: boolean;
              type?: string;
            }>
          ).filter((p) => p.name)
        : [],
    [skill]
  );

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      for (const p of parameters) {
        initial[p.name] = p.defaultValue ?? "";
      }
      setValues(initial);
    }
  }, [open, parameters]);

  const handleSubmit = () => {
    onSubmit(values);
    onOpenChange(false);
  };

  if (!skill || parameters.length === 0) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Paramètres du skill « {skill.name} »</DialogTitle>
          <DialogDescription>
            Renseignez les variables utilisées par ce skill pour ce message.
            Elles ne sont pas conservées.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {parameters.map((p) => (
            <div className="space-y-1.5" key={p.name}>
              <Label className="text-xs font-semibold">
                {p.name}
                {p.required ? " * " : ""}{" "}
                <span className="font-normal text-muted-foreground">
                  ({p.type || "string"})
                </span>
              </Label>
              {p.type === "enum" && p.enumValues?.length ? (
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                  }
                  value={values[p.name] ?? ""}
                >
                  <option value="">— Choisir —</option>
                  {p.enumValues.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [p.name]: e.target.value }))
                  }
                  placeholder={p.description || p.defaultValue || p.name}
                  value={values[p.name] ?? ""}
                />
              )}
              {p.description && (
                <p className="text-[11px] text-muted-foreground">
                  {p.description}
                </p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} type="button">
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
