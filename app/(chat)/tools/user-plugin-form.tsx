"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageBackButton } from "@/components/chat/page-back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LUCIDE_ICON_NAMES } from "@/lib/plugins/icon-allowlist";
import type { UserPluginView } from "@/lib/plugins/user-plugin-input";

type Kind = "mcp" | "oauth";

const fieldClass = "field-input h-11 w-full text-sm sm:h-9";

export function UserPluginForm({
  initial,
}: {
  initial?: UserPluginView | null;
}) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "mcp");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "Puzzle");
  const [version, setVersion] = useState(initial?.version ?? "1.0.0");
  const [transport, setTransport] = useState<"http" | "sse">(
    initial?.transport === "sse" ? "sse" : "http"
  );
  const [url, setUrl] = useState(initial?.url ?? "");
  const [authType, setAuthType] = useState<
    "none" | "bearer" | "custom_headers"
  >(
    initial?.authType === "none" || initial?.authType === "custom_headers"
      ? initial.authType
      : "bearer"
  );
  const [token, setToken] = useState("");
  const [headerName, setHeaderName] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [requireApproval, setRequireApproval] = useState(
    initial?.requireApproval ?? "write_only"
  );
  const [timeoutMs, setTimeoutMs] = useState(
    String(initial?.timeoutMs ?? 15_000)
  );
  const [rateLimit, setRateLimit] = useState(
    String(initial?.rateLimitPerMin ?? 60)
  );
  const [authorizeUrl, setAuthorizeUrl] = useState(initial?.authorizeUrl ?? "");
  const [tokenUrl, setTokenUrl] = useState(initial?.tokenUrl ?? "");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [scopes, setScopes] = useState(initial?.scopes ?? "");
  const [apiBaseUrl, setApiBaseUrl] = useState(initial?.apiBaseUrl ?? "");
  const [hosts, setHosts] = useState((initial?.hosts ?? []).join(", "));
  const [enabled, setEnabled] = useState(initial?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const legacyTransport = Boolean(
    initial?.transport && !["http", "sse"].includes(initial.transport)
  );

  async function save() {
    setSaving(true);
    try {
      const shared = {
        description,
        icon,
        name,
        version,
      };
      const body = editing
        ? {
            ...shared,
            isEnabled: enabled,
            ...(initial?.kind === "mcp" && !legacyTransport
              ? {
                  authType,
                  rateLimitPerMin: Number(rateLimit),
                  requireApproval,
                  timeoutMs: Number(timeoutMs),
                  transport,
                  url,
                  ...(token ? { token } : {}),
                  ...(headerName && headerValue
                    ? { headers: [{ name: headerName, value: headerValue }] }
                    : {}),
                }
              : {}),
            ...(initial?.kind === "oauth"
              ? {
                  apiBaseUrl,
                  authorizeUrl,
                  clientId,
                  hosts: hosts
                    .split(",")
                    .map((host) => host.trim())
                    .filter(Boolean),
                  scopes,
                  tokenUrl,
                  ...(clientSecret ? { clientSecret } : {}),
                }
              : {}),
          }
        : kind === "mcp"
          ? {
              ...shared,
              authType,
              headers:
                authType === "custom_headers" && headerName && headerValue
                  ? [{ name: headerName, value: headerValue }]
                  : undefined,
              kind,
              rateLimitPerMin: Number(rateLimit),
              requireApproval,
              timeoutMs: Number(timeoutMs),
              token: token || undefined,
              transport,
              url,
            }
          : {
              ...shared,
              apiBaseUrl,
              authorizeUrl,
              clientId,
              clientSecret,
              hosts: hosts
                .split(",")
                .map((host) => host.trim())
                .filter(Boolean),
              kind,
              scopes,
              tokenUrl,
            };
      const response = await fetch(
        editing ? `/api/user-plugins/${initial?.id}` : "/api/user-plugins",
        {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
          method: editing ? "PATCH" : "POST",
        }
      );
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
        plugin?: UserPluginView;
      } | null;
      if (!response.ok || !payload?.plugin) {
        throw new Error(payload?.message || "Enregistrement impossible.");
      }
      toast.success(editing ? "Plugin mis à jour." : "Plugin créé.");
      router.push(`/tools/plugins/custom/${payload.plugin.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/user-plugins/${initial.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message || "Suppression impossible.");
      }
      toast.success("Plugin supprimé.");
      router.push("/tools?tab=plugins");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-3 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <PageBackButton fallbackHref="/tools?tab=plugins" label="Retour" />
        <h1 className="truncate text-lg font-bold">
          {editing ? name || "Plugin" : "Nouveau plugin"}
        </h1>
      </div>

      {editing ? null : (
        <div className="grid grid-cols-2 gap-2">
          {(["mcp", "oauth"] as const).map((value) => (
            <button
              className="chip min-h-11"
              data-active={kind === value ? "true" : "false"}
              key={value}
              onClick={() => setKind(value)}
              type="button"
            >
              {value === "mcp" ? "Serveur MCP" : "OAuth"}
            </button>
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Nom
        <Input
          className={fieldClass}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Description
        <Input
          className={fieldClass}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Icône
          <select
            className={fieldClass}
            onChange={(event) => setIcon(event.target.value)}
            value={icon}
          >
            {(LUCIDE_ICON_NAMES as readonly string[]).includes(icon) ? null : (
              <option value={icon}>{icon}</option>
            )}
            {LUCIDE_ICON_NAMES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Version
          <Input
            className={fieldClass}
            onChange={(event) => setVersion(event.target.value)}
            value={version}
          />
        </label>
      </div>

      {(editing ? initial?.kind === "mcp" : kind === "mcp") ? (
        legacyTransport ? (
          <p className="surface-muted text-sm">
            Ce plugin historique utilise le transport {initial?.transport}. Le
            nom, l'icône, la version et l'activation restent modifiables.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Transport
                <select
                  className={fieldClass}
                  onChange={(event) =>
                    setTransport(event.target.value === "sse" ? "sse" : "http")
                  }
                  value={transport}
                >
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Authentification
                <select
                  className={fieldClass}
                  onChange={(event) =>
                    setAuthType(
                      event.target.value === "none" ||
                        event.target.value === "custom_headers"
                        ? event.target.value
                        : "bearer"
                    )
                  }
                  value={authType}
                >
                  <option value="none">Aucune</option>
                  <option value="bearer">Jeton bearer</option>
                  <option value="custom_headers">En-têtes</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              URL HTTPS
              <Input
                className={fieldClass}
                onChange={(event) => setUrl(event.target.value)}
                value={url}
              />
            </label>
            {authType === "bearer" ? (
              <label className="flex flex-col gap-1 text-sm">
                Jeton
                <Input
                  className={fieldClass}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder={
                    initial?.hasSecret ? "Laisser vide pour conserver" : ""
                  }
                  type="password"
                  value={token}
                />
              </label>
            ) : null}
            {authType === "custom_headers" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  Nom d'en-tête
                  <Input
                    className={fieldClass}
                    onChange={(event) => setHeaderName(event.target.value)}
                    value={headerName}
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Valeur
                  <Input
                    className={fieldClass}
                    onChange={(event) => setHeaderValue(event.target.value)}
                    type="password"
                    value={headerValue}
                  />
                </label>
              </div>
            ) : null}
            <label className="flex flex-col gap-1 text-sm">
              Approbation
              <select
                className={fieldClass}
                onChange={(event) => setRequireApproval(event.target.value)}
                value={requireApproval}
              >
                <option value="write_only">Écritures seulement</option>
                <option value="ask_permission">Toujours demander</option>
                <option value="always_allow">Toujours autoriser</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Délai (ms)
                <Input
                  className={fieldClass}
                  onChange={(event) => setTimeoutMs(event.target.value)}
                  value={timeoutMs}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Plafond / min
                <Input
                  className={fieldClass}
                  onChange={(event) => setRateLimit(event.target.value)}
                  value={rateLimit}
                />
              </label>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            URL d'autorisation
            <Input
              className={fieldClass}
              onChange={(event) => setAuthorizeUrl(event.target.value)}
              value={authorizeUrl}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            URL de jeton
            <Input
              className={fieldClass}
              onChange={(event) => setTokenUrl(event.target.value)}
              value={tokenUrl}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            URL d'API
            <Input
              className={fieldClass}
              onChange={(event) => setApiBaseUrl(event.target.value)}
              value={apiBaseUrl}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Identifiant client
            <Input
              className={fieldClass}
              onChange={(event) => setClientId(event.target.value)}
              value={clientId}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Secret client
            <Input
              className={fieldClass}
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder={
                initial?.hasSecret ? "Laisser vide pour conserver" : ""
              }
              type="password"
              value={clientSecret}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Portées
            <Input
              className={fieldClass}
              onChange={(event) => setScopes(event.target.value)}
              value={scopes}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hôtes autorisés, séparés par des virgules
            <Input
              className={fieldClass}
              onChange={(event) => setHosts(event.target.value)}
              value={hosts}
            />
          </label>
          {initial?.connected ? (
            <p className="text-sm text-success">
              Connecté
              {initial.connectedAccount ? ` — ${initial.connectedAccount}` : ""}
              .
            </p>
          ) : null}
          {editing && initial ? (
            <Button
              className="h-11 sm:h-9"
              onClick={() => {
                window.location.href = `/api/user-plugins/${initial.id}/connect`;
              }}
              type="button"
              variant="outline"
            >
              Connecter
            </Button>
          ) : null}
        </div>
      )}

      {editing ? (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
          Activé
        </label>
      ) : null}

      {initial && initial.tools.length > 0 ? (
        <ul className="surface-muted text-sm">
          {initial.tools.map((tool) => (
            <li key={tool.name}>{tool.name}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-11 sm:h-9"
          disabled={saving}
          onClick={save}
          type="button"
        >
          {editing ? "Enregistrer" : "Créer"}
        </Button>
        {editing ? (
          <Button
            className="h-11 sm:h-9"
            disabled={saving}
            onClick={remove}
            type="button"
            variant="outline"
          >
            Supprimer
          </Button>
        ) : null}
      </div>
    </div>
  );
}
