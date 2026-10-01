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

type SkillParameter = {
  defaultValue?: string;
  description?: string;
  enumValues?: string[];
  name: string;
  required?: boolean;
  type?: string;
};

function isSkillParameter(value: unknown): value is SkillParameter {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (value as { name?: unknown }).name === "string"
  );
}

export function SkillParamsDialog({
  onOpenChange,
  onSubmit,
  open,
  skill,
}: {
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Record<string, string>) => void;
  open: boolean;
  skill: Skill | null;
}) {
  const parameters = useMemo(
    () =>
      Array.isArray((skill as any)?.parameters)
        ? ((skill as any).parameters as unknown[]).filter(isSkillParameter)
        : [],
    [skill]
  );

  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      for (const parameter of parameters) {
        initial[parameter.name] = parameter.defaultValue ?? "";
      }
      setValues(initial);
      setError(null);
    }
  }, [open, parameters]);

  const handleSubmit = () => {
    const missing = parameters.find(
      (parameter) =>
        parameter.required && !String(values[parameter.name] ?? "").trim()
    );
    if (missing) {
      setError(`Le paramètre « ${missing.name} » est obligatoire.`);
      return;
    }

    for (const parameter of parameters) {
      const raw = String(values[parameter.name] ?? "").trim();
      if (!raw) continue;
      const type = (parameter.type || "string").toLowerCase();

      if (type === "number" || type === "integer") {
        const number = Number(raw);
        if (
          !Number.isFinite(number) ||
          (type === "integer" && !Number.isInteger(number))
        ) {
          setError(
            `« ${parameter.name} » doit être un nombre${type === "integer" ? " entier" : ""}.`
          );
          return;
        }
      }
      if (type === "boolean" && raw !== "true" && raw !== "false") {
        setError(`« ${parameter.name} » doit être vrai ou faux.`);
        return;
      }
      if (
        (type === "enum" || parameter.enumValues?.length) &&
        parameter.enumValues?.length &&
        !parameter.enumValues.includes(raw)
      ) {
        setError(
          `« ${parameter.name} » doit faire partie des valeurs proposées.`
        );
        return;
      }
    }

    onSubmit(
      Object.fromEntries(
        parameters.map((parameter) => [
          parameter.name,
          values[parameter.name] ?? "",
        ])
      )
    );
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
          {parameters.map((parameter) => {
            const id = `skill-param-${parameter.name}`;
            const type = (parameter.type || "string").toLowerCase();
            const isEnum =
              type === "enum" || Boolean(parameter.enumValues?.length);
            return (
              <div className="space-y-1.5" key={parameter.name}>
                <Label className="text-xs font-semibold" htmlFor={id}>
                  {parameter.name}
                  {parameter.required ? " *" : ""}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({type})
                  </span>
                </Label>
                {isEnum && parameter.enumValues?.length ? (
                  <select
                    aria-describedby={
                      parameter.description ? `${id}-description` : undefined
                    }
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    id={id}
                    onChange={(event) => {
                      setError(null);
                      setValues((previous) => ({
                        ...previous,
                        [parameter.name]: event.target.value,
                      }));
                    }}
                    required={parameter.required}
                    value={values[parameter.name] ?? ""}
                  >
                    <option value="">— Choisir —</option>
                    {parameter.enumValues.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : type === "boolean" ? (
                  <select
                    className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    id={id}
                    onChange={(event) => {
                      setError(null);
                      setValues((previous) => ({
                        ...previous,
                        [parameter.name]: event.target.value,
                      }));
                    }}
                    required={parameter.required}
                    value={values[parameter.name] ?? ""}
                  >
                    <option value="">— Choisir —</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <Input
                    id={id}
                    inputMode={
                      type === "number" || type === "integer"
                        ? "numeric"
                        : undefined
                    }
                    onChange={(event) => {
                      setError(null);
                      setValues((previous) => ({
                        ...previous,
                        [parameter.name]: event.target.value,
                      }));
                    }}
                    placeholder={
                      parameter.description ||
                      parameter.defaultValue ||
                      parameter.name
                    }
                    required={parameter.required}
                    step={type === "integer" ? 1 : undefined}
                    type={
                      type === "number" || type === "integer"
                        ? "number"
                        : "text"
                    }
                    value={values[parameter.name] ?? ""}
                  />
                )}
                {parameter.description && (
                  <p
                    className="text-[11px] text-muted-foreground"
                    id={`${id}-description`}
                  >
                    {parameter.description}
                  </p>
                )}
              </div>
            );
          })}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
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
