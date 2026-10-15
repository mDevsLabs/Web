import {
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppLocale, TFunction } from "../i18n";
import { LLM_PROVIDER_OPTIONS, type ModelRequestParadigm } from "../llmProvider";
import {
  createEmptyUserLlmProvider,
  createEmptyUserModel,
  DEFAULT_MODEL_MAX_OUTPUT_TOKENS,
  type DiscoveredProviderModel,
  mergeDiscoveredProviderModels,
  type OAuthProviderKind,
  type UserLlmProvider,
  type UserModelEntry,
} from "../modelCatalog";
import {
  type ProviderIdentityPreset,
  type ProviderIdentitySettings,
  resolveProviderIdentitySettings,
  resolveProviderIdentityWithOverride,
} from "../providerIdentitySettings";
import { IconSearch, OAuthProviderMark } from "./SettingsIcons";
import { VoidSelect } from "../VoidSelect";

export const PROVIDER_OAUTH_LOGIN_UI_TIMEOUT_MS = 5 * 60_000;
export const OAUTH_LOGIN_PROVIDERS: OAuthProviderKind[] = [
  "codex",
  "claude",
  "antigravity",
];

type ProviderGroupId = "manual" | OAuthProviderKind;

const PROVIDER_GROUPS: {
  id: ProviderGroupId;
  labelKey: string;
  oauthProvider?: OAuthProviderKind;
}[] = [
  { id: "manual", labelKey: "settings.providerGroup.manual" },
  {
    id: "codex",
    labelKey: "settings.providerGroup.codex",
    oauthProvider: "codex",
  },
  {
    id: "claude",
    labelKey: "settings.providerGroup.claude",
    oauthProvider: "claude",
  },
  {
    id: "antigravity",
    labelKey: "settings.providerGroup.antigravity",
    oauthProvider: "antigravity",
  },
];

const SYSTEM_PROVIDER_IDS = new Set<string>(["mai"]);
function isSystemProvider(provider: UserLlmProvider): boolean {
  return SYSTEM_PROVIDER_IDS.has(provider.id);
}

function providerGroupId(provider: UserLlmProvider): ProviderGroupId {
  const oauthProvider = provider.oauthAuth?.provider;
  if (
    oauthProvider === "codex" ||
    oauthProvider === "claude" ||
    oauthProvider === "antigravity"
  ) {
    return oauthProvider;
  }
  if (provider.codexAuth) {
    return "codex";
  }
  return "manual";
}

type OAuthUsageDisplay = {
  tone: "ok" | "warn" | "muted";
  title: string;
  body: string;
  meta?: string;
};

function formatOAuthNumber(
  value: number | undefined,
  locale: AppLocale
): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return new Intl.NumberFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function providerOAuthUsageDisplay(
  provider: UserLlmProvider,
  locale: AppLocale,
  t: TFunction
): OAuthUsageDisplay | null {
  const auth = provider.oauthAuth;
  if (auth?.provider === "codex") {
    const plan = auth.planType?.trim();
    return {
      body: plan
        ? t("settings.oauthUsage.codexPlan", { plan })
        : t("settings.oauthUsage.codexUnknown"),
      title: t("settings.oauthUsage.remainingTitle"),
      tone: "muted",
    };
  }
  if (auth?.provider !== "antigravity") {
    return null;
  }
  const usage = auth.usage;
  if (!usage || usage.provider !== "antigravity" || !usage.known) {
    return {
      body: t("settings.oauthUsage.antigravityUnknown"),
      title: t("settings.oauthUsage.remainingTitle"),
      tone: "muted",
    };
  }
  const amount = formatOAuthNumber(usage.creditAmount, locale);
  const minimum = formatOAuthNumber(usage.minCreditAmount, locale);
  const parts = [
    amount
      ? t("settings.oauthUsage.antigravityCredits", { amount })
      : t("settings.oauthUsage.antigravityUnknown"),
    minimum ? t("settings.oauthUsage.antigravityMinimum", { minimum }) : "",
    usage.paidTierId
      ? t("settings.oauthUsage.tier", { tier: usage.paidTierId })
      : "",
  ].filter(Boolean);
  const updated = usage.updatedAt
    ? new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "en-US", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
      }).format(new Date(usage.updatedAt))
    : "";
  return {
    body: parts.join(" · "),
    meta: updated
      ? t("settings.oauthUsage.updated", { time: updated })
      : undefined,
    title: t("settings.oauthUsage.remainingTitle"),
    tone: usage.available === false ? "warn" : "ok",
  };
}

export type ProviderDiscoverState = {
  status: "idle" | "loading" | "done";
  ok?: boolean;
  message?: string;
};

export type ProviderOAuthLoginState = {
  status: "idle" | "loading" | "done";
  provider?: OAuthProviderKind;
  ok?: boolean;
  message?: string;
};

type ProviderDiscoverModalState = {
  providerId: string;
  providerName: string;
  mergedEntries: UserModelEntry[];
  addedCount: number;
  totalDiscovered: number;
  duplicateCount: number;
};

export interface SettingsModelsPanelProps {
  t: TFunction;
  locale: AppLocale;
  shell: any;
  modelProviders: UserLlmProvider[];
  onChangeModelProviders: (providers: UserLlmProvider[]) => void;
  modelEntries: UserModelEntry[];
  onChangeModelEntries: (entries: UserModelEntry[]) => void;
  defaultModel: string;
  onPickDefaultModel: (id: string) => void;
  providerIdentity: ProviderIdentitySettings;
}

export function SettingsModelsPanel({
  t,
  locale,
  shell,
  modelProviders,
  onChangeModelProviders,
  modelEntries,
  onChangeModelEntries,
  defaultModel,
  onPickDefaultModel,
  providerIdentity,
}: SettingsModelsPanelProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [expandedProviderIds, setExpandedProviderIds] = useState<
    Record<string, boolean>
  >({});
  const toggleProviderExpanded = useCallback((id: string) => {
    setExpandedProviderIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const [providerDiscoverStateById, setProviderDiscoverStateById] = useState<
    Record<string, ProviderDiscoverState>
  >({});
  const [providerDiscoverModal, setProviderDiscoverModal] =
    useState<ProviderDiscoverModalState | null>(null);

  const [oauthLoginState, setOauthLoginState] =
    useState<ProviderOAuthLoginState>({ status: "idle" });
  const oauthLoginTimeoutRef = useRef<number | undefined>(undefined);

  const clearOAuthLoginTimeout = useCallback(() => {
    if (oauthLoginTimeoutRef.current !== undefined) {
      window.clearTimeout(oauthLoginTimeoutRef.current);
      oauthLoginTimeoutRef.current = undefined;
    }
  }, []);

  const oauthProviderLabel = useCallback(
    (provider: OAuthProviderKind) => t(`settings.oauthLogin.${provider}`),
    [t]
  );

  const formatOAuthLoginSuccess = useCallback(
    (
      provider: OAuthProviderKind,
      result: {
        accountId?: string;
        planType?: string;
        email?: string;
        projectId?: string;
        modelCount?: number;
      }
    ) => {
      const detail = result.email || result.accountId || result.projectId || "";
      const base = detail
        ? t("settings.oauthLoginSuccessWithDetail", {
            detail,
            provider: oauthProviderLabel(provider),
          })
        : t("settings.oauthLoginSuccess", {
            provider: oauthProviderLabel(provider),
          });
      return result.modelCount && result.modelCount > 1
        ? `${base} ${t("settings.oauthLoginModelsImported", { count: String(result.modelCount) })}`
        : base;
    },
    [oauthProviderLabel, t]
  );

  const patchProvider = useCallback(
    (id: string, patch: Partial<UserLlmProvider>) => {
      if (SYSTEM_PROVIDER_IDS.has(id)) return;
      onChangeModelProviders(
        modelProviders.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    [modelProviders, onChangeModelProviders]
  );

  const finishOAuthLogin = useCallback(
    (
      provider: OAuthProviderKind,
      result?: {
        ok?: boolean;
        message?: string;
        providerId?: string;
        providers?: UserLlmProvider[];
        models?: UserModelEntry[];
        addedModelsCount?: number;
        accountId?: string;
        planType?: string;
        email?: string;
        projectId?: string;
      }
    ) => {
      clearOAuthLoginTimeout();
      if (!result?.ok) {
        setOauthLoginState({
          message:
            result?.message?.trim() ||
            t("settings.oauthLoginFailed", {
              provider: oauthProviderLabel(provider),
            }),
          ok: false,
          provider,
          status: "done",
        });
        return;
      }

      if (Array.isArray(result.providers) && result.providers.length > 0) {
        onChangeModelProviders(result.providers);
      }
      if (Array.isArray(result.models) && result.models.length > 0) {
        onChangeModelEntries(result.models);
      }
      if (result.providerId) {
        setExpandedProviderIds((prev) => ({
          ...prev,
          [result.providerId!]: true,
        }));
      }

      setOauthLoginState({
        message: formatOAuthLoginSuccess(provider, {
          accountId: result.accountId,
          email: result.email,
          modelCount: result.addedModelsCount,
          planType: result.planType,
          projectId: result.projectId,
        }),
        ok: true,
        provider,
        status: "done",
      });
    },
    [
      clearOAuthLoginTimeout,
      formatOAuthLoginSuccess,
      oauthProviderLabel,
      onChangeModelEntries,
      onChangeModelProviders,
      t,
    ]
  );

  const runProviderOAuthLogin = useCallback(
    async (provider: OAuthProviderKind) => {
      if (!shell) {
        setOauthLoginState({
          message: t("settings.oauthLoginUnavailable"),
          ok: false,
          provider,
          status: "done",
        });
        return;
      }

      clearOAuthLoginTimeout();
      setOauthLoginState({
        provider,
        status: "loading",
      });

      oauthLoginTimeoutRef.current = window.setTimeout(() => {
        setOauthLoginState({
          message: t("settings.oauthLoginTimeout", {
            provider: oauthProviderLabel(provider),
          }),
          ok: false,
          provider,
          status: "done",
        });
      }, PROVIDER_OAUTH_LOGIN_UI_TIMEOUT_MS);

      try {
        const result = (await shell.invoke("settings:loginProviderOAuth", {
          provider,
        })) as
          | {
              ok?: boolean;
              message?: string;
              providerId?: string;
              providers?: UserLlmProvider[];
              models?: UserModelEntry[];
              addedModelsCount?: number;
              accountId?: string;
              planType?: string;
              email?: string;
              projectId?: string;
            }
          | undefined;

        finishOAuthLogin(provider, result);
      } catch (error) {
        clearOAuthLoginTimeout();
        setOauthLoginState({
          message:
            error instanceof Error
              ? error.message
              : String(
                  error ??
                    t("settings.oauthLoginFailed", {
                      provider: oauthProviderLabel(provider),
                    })
                ),
          ok: false,
          provider,
          status: "done",
        });
      }
    },
    [clearOAuthLoginTimeout, finishOAuthLogin, oauthProviderLabel, shell, t]
  );

  const modelsVisibleUnderProvider = useCallback(
    (provider: UserLlmProvider): UserModelEntry[] => {
      const all = modelEntries.filter((m) => m.providerId === provider.id);
      const q = deferredSearch.trim().toLowerCase();
      if (!q) {
        return all;
      }
      const headerHit =
        provider.displayName.toLowerCase().includes(q) ||
        t(`settings.paradigm.${provider.paradigm}`).toLowerCase().includes(q);
      if (headerHit) {
        return all;
      }
      return all.filter((m) => {
        const dn = m.displayName.toLowerCase();
        const rn = m.requestName.toLowerCase();
        return dn.includes(q) || rn.includes(q);
      });
    },
    [deferredSearch, modelEntries, t]
  );

  const removeProvider = useCallback(
    (pid: string) => {
      if (SYSTEM_PROVIDER_IDS.has(pid)) return;
      const removedIds = new Set(
        modelEntries.filter((m) => m.providerId === pid).map((m) => m.id)
      );
      onChangeModelProviders(modelProviders.filter((p) => p.id !== pid));
      onChangeModelEntries(modelEntries.filter((m) => m.providerId !== pid));
      if (removedIds.has(defaultModel)) {
        onPickDefaultModel("");
      }
    },
    [
      modelProviders,
      modelEntries,
      onChangeModelProviders,
      onChangeModelEntries,
      defaultModel,
      onPickDefaultModel,
    ]
  );

  const addProvider = useCallback(() => {
    const p = createEmptyUserLlmProvider();
    onChangeModelProviders([...modelProviders, p]);
  }, [modelProviders, onChangeModelProviders]);

  const addModelToProvider = useCallback(
    (providerId: string) => {
      if (SYSTEM_PROVIDER_IDS.has(providerId)) return;
      onChangeModelEntries([...modelEntries, createEmptyUserModel(providerId)]);
    },
    [modelEntries, onChangeModelEntries]
  );

  const patchEntry = useCallback(
    (id: string, patch: Partial<UserModelEntry>) => {
      const target = modelEntries.find((e) => e.id === id);
      if (target && SYSTEM_PROVIDER_IDS.has(target.providerId)) return;
      onChangeModelEntries(
        modelEntries.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    [modelEntries, onChangeModelEntries]
  );

  const providerIdentityOverridePreset = useCallback(
    (provider: UserLlmProvider): ProviderIdentityPreset => {
      if (!provider.providerIdentity) {
        return "inherit";
      }
      return (
        provider.providerIdentity.preset ??
        resolveProviderIdentitySettings(provider.providerIdentity).preset
      );
    },
    []
  );

  const patchProviderIdentityOverride = useCallback(
    (providerId: string, patch: Partial<ProviderIdentitySettings>) => {
      const current = modelProviders.find(
        (provider) => provider.id === providerId
      )?.providerIdentity ?? { preset: "inherit" as const };
      const next: ProviderIdentitySettings = { ...current, ...patch };
      if (next.preset === "inherit") {
        patchProvider(providerId, { providerIdentity: undefined });
        return;
      }
      patchProvider(providerId, { providerIdentity: next });
    },
    [modelProviders, patchProvider]
  );

  const removeEntry = useCallback(
    (id: string) => {
      const target = modelEntries.find((e) => e.id === id);
      if (target && SYSTEM_PROVIDER_IDS.has(target.providerId)) return;
      onChangeModelEntries(modelEntries.filter((e) => e.id !== id));
      if (defaultModel === id) {
        onPickDefaultModel("");
      }
    },
    [modelEntries, onChangeModelEntries, defaultModel, onPickDefaultModel]
  );

  const applyProviderDiscoverImport = useCallback(() => {
    if (!providerDiscoverModal) {
      return;
    }
    onChangeModelEntries(providerDiscoverModal.mergedEntries);
    setProviderDiscoverStateById((prev) => ({
      ...prev,
      [providerDiscoverModal.providerId]: {
        message:
          providerDiscoverModal.addedCount > 0
            ? t("settings.discoverModelsImported", {
                addedCount: providerDiscoverModal.addedCount,
                totalCount: providerDiscoverModal.totalDiscovered,
              })
            : t("settings.searchProviderModelsNothingNew"),
        ok: true,
        status: "done",
      },
    }));
    setProviderDiscoverModal(null);
  }, [onChangeModelEntries, providerDiscoverModal, t]);

  const discoverModelsForProvider = useCallback(
    async (provider: UserLlmProvider) => {
      if (isSystemProvider(provider)) return;
      if (!shell) {
        setProviderDiscoverStateById((prev) => ({
          ...prev,
          [provider.id]: {
            message: t("settings.discoverModelsUnavailable"),
            ok: false,
            status: "done",
          },
        }));
        return;
      }

      setProviderDiscoverStateById((prev) => ({
        ...prev,
        [provider.id]: { status: "loading" },
      }));

      try {
        const result = (await shell.invoke(
          "settings:discoverProviderModels",
          provider
        )) as
          | {
              ok?: boolean;
              models?: {
                id?: string;
                displayName?: string;
                contextWindowTokens?: number;
                maxOutputTokens?: number;
              }[];
              oauthAuth?: UserLlmProvider["oauthAuth"];
              message?: string;
            }
          | undefined;
        if (result?.ok !== true) {
          setProviderDiscoverStateById((prev) => ({
            ...prev,
            [provider.id]: {
              message:
                result?.message?.trim() || t("settings.discoverModelsFailed"),
              ok: false,
              status: "done",
            },
          }));
          return;
        }

        const discoveredModels: DiscoveredProviderModel[] = (
          result.models ?? []
        )
          .filter(
            (model) =>
              typeof model?.id === "string" && model.id.trim().length > 0
          )
          .map((model) => ({
            contextWindowTokens: model.contextWindowTokens,
            displayName:
              typeof model.displayName === "string"
                ? model.displayName.trim()
                : undefined,
            maxOutputTokens: model.maxOutputTokens,
            requestName: String(model.id).trim(),
          }));
        if (result.oauthAuth) {
          patchProvider(provider.id, {
            apiKey: result.oauthAuth.accessToken,
            oauthAuth: result.oauthAuth,
          });
        }
        const merged = mergeDiscoveredProviderModels(
          modelEntries,
          provider.id,
          discoveredModels
        );
        setProviderDiscoverStateById((prev) => ({
          ...prev,
          [provider.id]: {
            message: undefined,
            ok: true,
            status: "done",
          },
        }));
        setProviderDiscoverModal({
          addedCount: merged.addedCount,
          duplicateCount: Math.max(
            0,
            merged.totalDiscovered - merged.addedCount
          ),
          mergedEntries: merged.entries,
          providerId: provider.id,
          providerName:
            provider.displayName.trim() || t("settings.providerUntitled"),
          totalDiscovered: merged.totalDiscovered,
        });
      } catch (error) {
        setProviderDiscoverStateById((prev) => ({
          ...prev,
          [provider.id]: {
            message:
              error instanceof Error
                ? error.message
                : String(error ?? t("settings.discoverModelsFailed")),
            ok: false,
            status: "done",
          },
        }));
      }
    },
    [modelEntries, patchProvider, shell, t]
  );

  const groupedProviders = useMemo(() => {
    const list = modelProviders.filter((p) => {
      if (isSystemProvider(p)) return false;
      const q = deferredSearch.trim().toLowerCase();
      if (!q) {
        return true;
      }
      if (
        p.displayName.toLowerCase().includes(q) ||
        t(`settings.paradigm.${p.paradigm}`).toLowerCase().includes(q)
      ) {
        return true;
      }
      return modelsVisibleUnderProvider(p).length > 0;
    });

    const byGroup = new Map<ProviderGroupId, UserLlmProvider[]>();
    for (const group of PROVIDER_GROUPS) {
      byGroup.set(group.id, []);
    }

    for (const provider of list) {
      const gid = providerGroupId(provider);
      const groupList = byGroup.get(gid) ?? [];
      groupList.push(provider);
      byGroup.set(gid, groupList);
    }

    return PROVIDER_GROUPS.map((group) => ({
      ...group,
      providers: byGroup.get(group.id) ?? [],
    })).filter((group) => group.providers.length > 0);
  }, [deferredSearch, modelProviders, modelsVisibleUnderProvider, t]);

  return (
    <>
      <div className="ref-settings-panel ref-settings-panel--models">
        <p className="ref-settings-models-hint">{t("settings.modelsHint")}</p>
        <p className="ref-settings-models-provider-lead">
          {t("settings.modelsProviderLead")}
        </p>

        <div className="ref-settings-models-toolbar">
          <div className="ref-settings-models-primary-row">
            <div className="ref-settings-models-search-wrap ref-settings-models-search-wrap--compact">
              <IconSearch className="ref-settings-models-search-ico" />
              <input
                className="ref-settings-models-search"
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("settings.modelSearchPlaceholder")}
                value={search}
              />
            </div>
            <button
              className="ref-settings-add-model ref-settings-model-action-btn"
              onClick={addProvider}
              type="button"
            >
              {t("settings.addProvider")}
            </button>
          </div>
          <div className="ref-settings-models-actions">
            {OAUTH_LOGIN_PROVIDERS.map((provider) => {
              const isLoading =
                oauthLoginState.status === "loading" &&
                oauthLoginState.provider === provider;
              const anotherLoading =
                oauthLoginState.status === "loading" &&
                oauthLoginState.provider !== provider;
              return (
                <button
                  aria-busy={isLoading}
                  className={`ref-settings-add-model ref-settings-oauth-login-btn ref-settings-oauth-login-btn--${provider} ${
                    isLoading ? "is-loading" : ""
                  }`}
                  disabled={!shell || anotherLoading}
                  key={provider}
                  onClick={() => void runProviderOAuthLogin(provider)}
                  type="button"
                >
                  <OAuthProviderMark provider={provider} />
                  <span>
                    {isLoading
                      ? t("settings.oauthLoginCancel")
                      : t(`settings.oauthLogin.${provider}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {oauthLoginState.status === "done" && oauthLoginState.message ? (
          <p
            className="ref-settings-field-hint ref-settings-oauth-login-message"
            style={{
              color:
                oauthLoginState.ok === false
                  ? "var(--void-danger, #ef4444)"
                  : undefined,
            }}
          >
            {oauthLoginState.message}
          </p>
        ) : null}

        <div
          aria-label={t("settings.modelCatalog")}
          className="ref-settings-provider-groups"
        >
          {groupedProviders.map((group) => (
            <section className="ref-settings-provider-group" key={group.id}>
              <div className="ref-settings-provider-group-head">
                <div className="ref-settings-provider-group-title-wrap">
                  {group.oauthProvider ? (
                    <OAuthProviderMark provider={group.oauthProvider} />
                  ) : null}
                  <h3 className="ref-settings-provider-group-title">
                    {t(group.labelKey)}
                  </h3>
                </div>
                <span className="ref-settings-provider-group-count">
                  {t("settings.providerGroupCount", {
                    count: String(group.providers.length),
                  })}
                </span>
              </div>
              <ul
                aria-label={t(group.labelKey)}
                className="ref-settings-provider-root-list"
              >
                {group.providers.map((prov) => {
                  const subModels = modelsVisibleUnderProvider(prov);
                  const discoverState = providerDiscoverStateById[prov.id];
                  const providerExpanded = expandedProviderIds[prov.id] === true;
                  const providerBodyId = `settings-provider-body-${prov.id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
                  const identityPreset = providerIdentityOverridePreset(prov);
                  const providerIdentityResolved =
                    identityPreset === "inherit"
                      ? resolveProviderIdentityWithOverride(
                          providerIdentity,
                          prov.providerIdentity
                        )
                      : resolveProviderIdentitySettings(prov.providerIdentity);
                  const oauthUsage = providerOAuthUsageDisplay(
                    prov,
                    locale,
                    t
                  );
                  return (
                    <li className="ref-settings-provider-shell" key={prov.id}>
                      <div
                        className={`ref-settings-provider-details ${providerExpanded ? "is-open" : ""}`}
                      >
                        <button
                          aria-controls={providerBodyId}
                          aria-expanded={providerExpanded}
                          className="ref-settings-provider-summary"
                          onClick={() => toggleProviderExpanded(prov.id)}
                          type="button"
                        >
                          <span
                            aria-hidden
                            className="ref-settings-provider-summary-chev"
                          />
                          <span className="ref-settings-provider-summary-text">
                            {prov.displayName.trim() ||
                              t("settings.providerUntitled")}
                          </span>
                          <span className="ref-settings-provider-summary-tag">
                            {t(`settings.paradigm.${prov.paradigm}`)}
                          </span>
                        </button>

                        <div
                          aria-hidden={!providerExpanded}
                          className="ref-settings-provider-collapse"
                          id={providerBodyId}
                        >
                          <div className="ref-settings-provider-collapse-inner">
                            <div className="ref-settings-provider-body">
                              <div className="ref-settings-provider-creds">
                                <label className="ref-settings-field ref-settings-field--compact">
                                  <span>{t("settings.providerName")}</span>
                                  <input
                                    autoComplete="off"
                                    onChange={(e) =>
                                      patchProvider(prov.id, {
                                        displayName: e.target.value,
                                      })
                                    }
                                    placeholder={t("settings.providerNamePh")}
                                    value={prov.displayName}
                                  />
                                </label>
                                <label className="ref-settings-field ref-settings-field--compact">
                                  <span>{t("settings.requestParadigm")}</span>
                                  <VoidSelect
                                    ariaLabel={t("settings.paradigmAria")}
                                    onChange={(v) =>
                                      patchProvider(prov.id, {
                                        paradigm: v as ModelRequestParadigm,
                                      })
                                    }
                                    options={LLM_PROVIDER_OPTIONS.map((o) => ({
                                      label: t(`settings.paradigm.${o.id}`),
                                      value: o.id,
                                    }))}
                                    value={prov.paradigm}
                                  />
                                </label>
                                <label className="ref-settings-field ref-settings-field--compact">
                                  <span>{t("settings.apiKey")}</span>
                                  <input
                                    autoComplete="off"
                                    onChange={(e) =>
                                      patchProvider(prov.id, {
                                        apiKey: e.target.value,
                                      })
                                    }
                                    placeholder={t("settings.apiKeyPh")}
                                    type="password"
                                    value={prov.apiKey}
                                  />
                                </label>
                                <label className="ref-settings-field ref-settings-field--compact">
                                  <span>{t("settings.endpoint")}</span>
                                  <input
                                    autoComplete="off"
                                    onChange={(e) =>
                                      patchProvider(prov.id, {
                                        baseURL: e.target.value,
                                      })
                                    }
                                    placeholder={t("settings.endpointPh")}
                                    value={prov.baseURL ?? ""}
                                  />
                                </label>

                                <div className="ref-settings-field ref-settings-field--compact">
                                  <span>
                                    {t("settings.providerIdentityOverride")}
                                  </span>
                                  <VoidSelect
                                    ariaLabel={t(
                                      "settings.providerIdentityOverride"
                                    )}
                                    onChange={(next) =>
                                      patchProviderIdentityOverride(prov.id, {
                                        preset: next as ProviderIdentityPreset,
                                      })
                                    }
                                    options={[
                                      {
                                        label: t(
                                          "settings.providerIdentityOverride.inherit"
                                        ),
                                        value: "inherit",
                                      },
                                      {
                                        label: t(
                                          "settings.general.identityPreset.mai"
                                        ),
                                        value: "async-default",
                                      },
                                      {
                                        label: t(
                                          "settings.general.identityPreset.claudeCode"
                                        ),
                                        value: "claude-code",
                                      },
                                      {
                                        label: t(
                                          "settings.general.identityPreset.codex"
                                        ),
                                        value: "codex",
                                      },
                                      {
                                        label: t(
                                          "settings.general.identityPreset.antigravity"
                                        ),
                                        value: "antigravity",
                                      },
                                      {
                                        label: t(
                                          "settings.general.identityPreset.custom"
                                        ),
                                        value: "custom",
                                      },
                                    ]}
                                    value={identityPreset}
                                  />
                                  <p className="ref-settings-proxy-hint ref-settings-field-footnote">
                                    {identityPreset === "inherit"
                                      ? t(
                                          "settings.providerIdentityOverride.inheritHint"
                                        )
                                      : t(
                                          "settings.providerIdentityOverride.overrideHint"
                                        )}
                                  </p>
                                </div>

                                {identityPreset === "custom" ? (
                                  <>
                                    <label className="ref-settings-field ref-settings-field--compact">
                                      <span>
                                        {t(
                                          "settings.general.identityUserAgentProduct"
                                        )}
                                      </span>
                                      <input
                                        onChange={(event) =>
                                          patchProviderIdentityOverride(
                                            prov.id,
                                            {
                                              userAgentProduct:
                                                event.target.value,
                                            }
                                          )
                                        }
                                        spellCheck={false}
                                        type="text"
                                        value={
                                          providerIdentityResolved.userAgentProduct
                                        }
                                      />
                                    </label>
                                    <label className="ref-settings-field ref-settings-field--compact">
                                      <span>
                                        {t(
                                          "settings.general.identityEntrypoint"
                                        )}
                                      </span>
                                      <input
                                        onChange={(event) =>
                                          patchProviderIdentityOverride(
                                            prov.id,
                                            {
                                              entrypoint: event.target.value,
                                            }
                                          )
                                        }
                                        spellCheck={false}
                                        type="text"
                                        value={
                                          providerIdentityResolved.entrypoint
                                        }
                                      />
                                    </label>
                                    <label className="ref-settings-field ref-settings-field--compact">
                                      <span>
                                        {t(
                                          "settings.general.identityAppHeader"
                                        )}
                                      </span>
                                      <input
                                        onChange={(event) =>
                                          patchProviderIdentityOverride(
                                            prov.id,
                                            {
                                              appHeaderValue:
                                                event.target.value,
                                            }
                                          )
                                        }
                                        spellCheck={false}
                                        type="text"
                                        value={
                                          providerIdentityResolved.appHeaderValue
                                        }
                                      />
                                    </label>
                                    <label className="ref-settings-field ref-settings-field--compact">
                                      <span>
                                        {t(
                                          "settings.general.identityClientApp"
                                        )}
                                      </span>
                                      <input
                                        onChange={(event) =>
                                          patchProviderIdentityOverride(
                                            prov.id,
                                            {
                                              clientAppValue:
                                                event.target.value,
                                            }
                                          )
                                        }
                                        spellCheck={false}
                                        type="text"
                                        value={
                                          providerIdentityResolved.clientAppValue
                                        }
                                      />
                                    </label>
                                    <label className="ref-settings-field ref-settings-field--compact">
                                      <span>
                                        {t(
                                          "settings.general.identitySystemPromptText"
                                        )}
                                      </span>
                                      <textarea
                                        onChange={(event) =>
                                          patchProviderIdentityOverride(
                                            prov.id,
                                            {
                                              systemPromptPrefix:
                                                event.target.value,
                                            }
                                          )
                                        }
                                        spellCheck={false}
                                        value={
                                          providerIdentityResolved.systemPromptPrefix
                                        }
                                      />
                                    </label>
                                  </>
                                ) : null}

                                {oauthUsage ? (
                                  <div
                                    className={`ref-settings-provider-usage ref-settings-provider-usage--${oauthUsage.tone}`}
                                  >
                                    <div className="ref-settings-provider-usage-head">
                                      <span className="ref-settings-provider-usage-title">
                                        {oauthUsage.title}
                                      </span>
                                      {oauthUsage.meta ? (
                                        <span className="ref-settings-provider-usage-meta">
                                          {oauthUsage.meta}
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="ref-settings-provider-usage-body">
                                      {oauthUsage.body}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              <div className="ref-settings-provider-actions">
                                <button
                                  className="ref-settings-remove-model"
                                  onClick={() => removeProvider(prov.id)}
                                  type="button"
                                >
                                  {t("settings.deleteProvider")}
                                </button>
                                <div className="ref-settings-provider-actions-right">
                                  <button
                                    aria-busy={
                                      discoverState?.status === "loading"
                                    }
                                    className={`ref-settings-add-model ref-settings-model-action-btn ${
                                      discoverState?.status === "loading"
                                        ? "is-loading"
                                        : ""
                                    }`}
                                    disabled={
                                      !shell ||
                                      discoverState?.status === "loading"
                                    }
                                    onClick={() =>
                                      void discoverModelsForProvider(prov)
                                    }
                                    type="button"
                                  >
                                    {discoverState?.status === "loading"
                                      ? t("settings.discoveringModels")
                                      : t("settings.discoverModels")}
                                  </button>
                                  <button
                                    className="ref-settings-add-model ref-settings-model-action-btn"
                                    onClick={() => addModelToProvider(prov.id)}
                                    type="button"
                                  >
                                    {t("settings.addModel")}
                                  </button>
                                </div>
                              </div>

                              {discoverState?.status === "done" &&
                              discoverState.message ? (
                                <p
                                  className="ref-settings-field-hint ref-settings-discover-message"
                                  style={{
                                    color:
                                      discoverState.ok === false
                                        ? "var(--void-danger, #ef4444)"
                                        : undefined,
                                  }}
                                >
                                  {discoverState.message}
                                </p>
                              ) : null}

                              <div className="ref-settings-sub-models">
                                <span className="ref-settings-sub-models-title">
                                  {t("settings.modelsListTitle")}
                                </span>
                                <ul
                                  aria-label={t("settings.modelsListTitle")}
                                  className="ref-settings-sub-models-list"
                                >
                                  {subModels.map((m) => {
                                    const maxOut =
                                      m.maxOutputTokens ??
                                      DEFAULT_MODEL_MAX_OUTPUT_TOKENS;
                                    const isDef = defaultModel === m.id;
                                    const temperatureMode =
                                      m.temperature === undefined
                                        ? "auto"
                                        : "custom";
                                    return (
                                      <li
                                        className="ref-settings-sub-model-item"
                                        key={m.id}
                                      >
                                        <div className="ref-settings-sub-model-row">
                                          <input
                                            className="ref-settings-sub-model-name"
                                            onChange={(e) =>
                                              patchEntry(m.id, {
                                                displayName: e.target.value,
                                              })
                                            }
                                            placeholder={t(
                                              "settings.modelDisplayNamePh"
                                            )}
                                            value={m.displayName}
                                          />
                                          <input
                                            className="ref-settings-sub-model-req"
                                            onChange={(e) =>
                                              patchEntry(m.id, {
                                                requestName: e.target.value,
                                              })
                                            }
                                            placeholder={t(
                                              "settings.modelRequestNamePh"
                                            )}
                                            value={m.requestName}
                                          />
                                          <div className="ref-settings-sub-model-btns">
                                            <button
                                              aria-pressed={isDef}
                                              className={`ref-settings-pick-def ${isDef ? "is-default" : ""}`}
                                              onClick={() =>
                                                onPickDefaultModel(
                                                  isDef ? "" : m.id
                                                )
                                              }
                                              title={t(
                                                "settings.defaultModelTitle"
                                              )}
                                              type="button"
                                            >
                                              {isDef
                                                ? t("settings.defaultBadge")
                                                : t("settings.setDefault")}
                                            </button>
                                            <button
                                              aria-label={t(
                                                "settings.removeModelAria"
                                              )}
                                              className="ref-settings-sub-model-del"
                                              onClick={() => removeEntry(m.id)}
                                              type="button"
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </div>
                                        <details className="ref-settings-model-advanced">
                                          <summary className="ref-settings-model-advanced-sum">
                                            {t("settings.modelLimitsSummary")}
                                          </summary>
                                          <div className="ref-settings-model-advanced-body">
                                            <label className="ref-settings-field ref-settings-field--compact">
                                              <span>
                                                {t(
                                                  "settings.temperatureModeLabel"
                                                )}
                                              </span>
                                              <VoidSelect
                                                ariaLabel={t(
                                                  "settings.temperatureModeLabel"
                                                )}
                                                onChange={(val) => {
                                                  if (val === "auto") {
                                                    patchEntry(m.id, {
                                                      temperature: undefined,
                                                    });
                                                  } else {
                                                    patchEntry(m.id, {
                                                      temperature: 1,
                                                    });
                                                  }
                                                }}
                                                options={[
                                                  {
                                                    label: t(
                                                      "settings.temperatureModeAuto"
                                                    ),
                                                    value: "auto",
                                                  },
                                                  {
                                                    label: t(
                                                      "settings.temperatureModeCustom"
                                                    ),
                                                    value: "custom",
                                                  },
                                                ]}
                                                value={temperatureMode}
                                              />
                                              <p className="ref-settings-proxy-hint ref-settings-field-footnote">
                                                {t(
                                                  "settings.temperatureModeHint"
                                                )}
                                              </p>
                                            </label>
                                            {temperatureMode === "custom" ? (
                                              <label className="ref-settings-field ref-settings-field--compact">
                                                <span>
                                                  {t("settings.temperature")}
                                                </span>
                                                <input
                                                  max={2}
                                                  min={0}
                                                  onChange={(e) => {
                                                    const raw =
                                                      e.target.value.trim();
                                                    if (raw === "") {
                                                      patchEntry(m.id, {
                                                        temperature: undefined,
                                                      });
                                                      return;
                                                    }
                                                    const v =
                                                      Number.parseFloat(raw);
                                                    patchEntry(m.id, {
                                                      temperature: Number.isNaN(v)
                                                        ? undefined
                                                        : Math.max(
                                                            0,
                                                            Math.min(2, v)
                                                          ),
                                                    });
                                                  }}
                                                  placeholder="1"
                                                  step={0.05}
                                                  type="number"
                                                  value={m.temperature ?? ""}
                                                />
                                                <p className="ref-settings-proxy-hint ref-settings-field-footnote">
                                                  {t(
                                                    "settings.temperatureCustomHint"
                                                  )}
                                                </p>
                                              </label>
                                            ) : null}
                                            <label className="ref-settings-field ref-settings-field--compact">
                                              <span>
                                                {t("settings.maxOutputTokens")}
                                              </span>
                                              <input
                                                max={128_000}
                                                min={1}
                                                onChange={(e) => {
                                                  const v = Number.parseInt(
                                                    e.target.value,
                                                    10
                                                  );
                                                  patchEntry(m.id, {
                                                    maxOutputTokens:
                                                      Number.isNaN(v) ? undefined : v,
                                                  });
                                                }}
                                                type="number"
                                                value={maxOut}
                                              />
                                              <p className="ref-settings-proxy-hint ref-settings-field-footnote">
                                                {t(
                                                  "settings.maxOutputTokensHint"
                                                )}
                                              </p>
                                            </label>
                                            <label className="ref-settings-field ref-settings-field--compact">
                                              <span>
                                                {t(
                                                  "settings.contextWindowTokens"
                                                )}
                                              </span>
                                              <input
                                                max={2_000_000}
                                                min={1024}
                                                onChange={(e) => {
                                                  const raw =
                                                    e.target.value.trim();
                                                  if (raw === "") {
                                                    patchEntry(m.id, {
                                                      contextWindowTokens:
                                                        undefined,
                                                    });
                                                    return;
                                                  }
                                                  const v = Number.parseInt(
                                                    raw,
                                                    10
                                                  );
                                                  patchEntry(m.id, {
                                                    contextWindowTokens:
                                                      Number.isNaN(v)
                                                        ? undefined
                                                        : v,
                                                  });
                                                }}
                                                placeholder="—"
                                                type="number"
                                                value={
                                                  m.contextWindowTokens ?? ""
                                                }
                                              />
                                              <p className="ref-settings-proxy-hint ref-settings-field-footnote">
                                                {t(
                                                  "settings.contextWindowTokensHint"
                                                )}
                                              </p>
                                            </label>
                                          </div>
                                        </details>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {providerDiscoverModal ? (
        <div
          className="modal-backdrop"
          onClick={() => setProviderDiscoverModal(null)}
          role="presentation"
        >
          <div
            aria-labelledby="ref-settings-provider-search-title"
            aria-modal="true"
            className="modal ref-settings-provider-search-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <h2 id="ref-settings-provider-search-title">
              {t("settings.searchProviderModelsTitle")}
            </h2>
            <div className="ref-settings-provider-search-modal-copy">
              <p className="ref-settings-lead" style={{ marginBottom: 10 }}>
                {t("settings.searchProviderModelsSummary", {
                  providerName: providerDiscoverModal.providerName,
                  totalCount: providerDiscoverModal.totalDiscovered,
                })}
              </p>
              {providerDiscoverModal.duplicateCount > 0 ? (
                <p className="ref-settings-field-hint" style={{ marginTop: 0 }}>
                  {t("settings.searchProviderModelsFiltered", {
                    duplicateCount: providerDiscoverModal.duplicateCount,
                  })}
                </p>
              ) : null}
              <p className="ref-settings-field-hint" style={{ marginTop: 0 }}>
                {providerDiscoverModal.addedCount > 0
                  ? t("settings.searchProviderModelsImportReady", {
                      addedCount: providerDiscoverModal.addedCount,
                    })
                  : t("settings.searchProviderModelsNothingNew")}
              </p>
            </div>

            <div className="ref-settings-provider-search-stats">
              <div className="ref-settings-provider-search-stat-row">
                <span>{t("settings.providerName")}</span>
                <strong>{providerDiscoverModal.providerName}</strong>
              </div>
              <div className="ref-settings-provider-search-stat-row">
                <span>{t("settings.searchProviderModelsFoundLabel")}</span>
                <strong>{String(providerDiscoverModal.totalDiscovered)}</strong>
              </div>
              <div className="ref-settings-provider-search-stat-row">
                <span>{t("settings.searchProviderModelsDuplicateLabel")}</span>
                <strong>{String(providerDiscoverModal.duplicateCount)}</strong>
              </div>
              <div className="ref-settings-provider-search-stat-row">
                <span>{t("settings.searchProviderModelsImportableLabel")}</span>
                <strong>{String(providerDiscoverModal.addedCount)}</strong>
              </div>
            </div>

            <div className="modal-actions ref-settings-provider-search-modal-actions">
              <button
                className="ref-settings-remove-model"
                onClick={() => setProviderDiscoverModal(null)}
                type="button"
              >
                {t("settings.searchProviderModelsClose")}
              </button>
              {providerDiscoverModal.addedCount > 0 ? (
                <button
                  className="ref-settings-add-model ref-settings-provider-search-btn"
                  onClick={applyProviderDiscoverImport}
                  type="button"
                >
                  {t("settings.searchProviderModelsConfirm")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
