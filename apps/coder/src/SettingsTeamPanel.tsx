import { useEffect, useMemo, useState } from "react";
import type {
  TeamExpertConfig,
  TeamRoleType,
  TeamSettings,
  TeamSource,
} from "./agentSettingsTypes";
import { useI18n } from "./i18n";
import type { UserLlmProvider, UserModelEntry } from "./modelCatalog";
import { providerDisplayLabel } from "./modelCatalog";
import type {
  BuiltinTeamCatalogPayload,
  BuiltinTeamExpertSummary,
} from "./teamBuiltinCatalogTypes";
import {
  buildDefaultCustomTeamExperts,
  getTeamSourceDefaults,
  inferTeamSource,
} from "./teamPresetCatalog";
import { VoidSelect } from "./VoidSelect";

type Props = {
  value: TeamSettings;
  onChange: (next: TeamSettings) => void;
  modelEntries: UserModelEntry[];
  modelProviders?: UserLlmProvider[];
};

const ROLE_IDS: TeamRoleType[] = [
  "team_lead",
  "frontend",
  "backend",
  "qa",
  "reviewer",
  "custom",
];
const FALLBACK_BUILTIN_REPO_PATH = "D:\\WebstormProjects\\agency-agents";

function newRole(): TeamExpertConfig {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `team-${Date.now()}`;
  return {
    allowedTools: [],
    assignmentKey: `specialist_${Date.now()}`,
    enabled: true,
    id,
    name: "",
    roleType: "custom",
    systemPrompt:
      "You are a specialist engineer. Complete assigned tasks with clear output.",
  };
}

function defaultPlanReviewerPrompt() {
  return [
    "You are reviewing a proposed team plan before any specialist executes.",
    "Judge role fit, task granularity, acceptance criteria clarity, and dependency sanity.",
    "Do not review implementation quality yet because no implementation exists.",
    "Surface ambiguity, missing scope, and blockers directly and concisely.",
  ].join("\n");
}

function defaultDeliveryReviewerPrompt() {
  return [
    "You are reviewing completed specialist outputs for correctness, regressions, and delivery quality.",
    "Judge whether the delivered work satisfies the user goal and whether important gaps remain.",
    "Be concrete about blockers, risks, and missing verification.",
  ].join("\n");
}

function newReviewer(kind: "plan" | "delivery"): TeamExpertConfig {
  return {
    allowedTools: ["Read", "Glob", "Grep", "LSP"],
    assignmentKey: "reviewer",
    enabled: true,
    id: `team-${kind}-reviewer`,
    name: kind === "plan" ? "Plan Reviewer" : "Delivery Reviewer",
    roleType: "reviewer",
    systemPrompt:
      kind === "plan"
        ? defaultPlanReviewerPrompt()
        : defaultDeliveryReviewerPrompt(),
  };
}

function builtinRoleLabel(
  role: BuiltinTeamExpertSummary,
  t: ReturnType<typeof useI18n>["t"]
): string {
  return t(`settings.team.role.${role.roleType}`) || role.roleType;
}

function modelDisplayText(
  modelId: string | undefined,
  modelEntries: UserModelEntry[],
  modelProviders: UserLlmProvider[]
): string | undefined {
  const normalizedModelId = String(modelId ?? "").trim();
  if (!normalizedModelId) {
    return;
  }
  const model = modelEntries.find((entry) => entry.id === normalizedModelId);
  if (!model) {
    return normalizedModelId;
  }
  const providerName = providerDisplayLabel(model.providerId, modelProviders);
  const modelName = model.displayName.trim() || model.requestName || model.id;
  return providerName ? `${modelName} (${providerName})` : modelName;
}

function builtinModelSourceText(params: {
  overrideModelId?: string;
  globalModelLabel?: string;
  t: ReturnType<typeof useI18n>["t"];
}): string {
  if (params.overrideModelId?.trim()) {
    return params.t("settings.team.builtinModelSource.override");
  }
  if (params.globalModelLabel?.trim()) {
    return params.t("settings.team.builtinModelSource.global");
  }
  return params.t("settings.team.builtinModelSource.session");
}

export function SettingsTeamPanel({
  value,
  onChange,
  modelEntries,
  modelProviders = [],
}: Props) {
  const { t } = useI18n();
  const teamSource = inferTeamSource(value);
  const experts = Array.isArray(value.experts) ? value.experts : [];
  const customRoleList = experts;
  const [editingRole, setEditingRole] = useState<TeamExpertConfig | null>(null);
  const [builtinCatalog, setBuiltinCatalog] =
    useState<BuiltinTeamCatalogPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    const shell = window.maiShell;
    if (!shell) {
      setBuiltinCatalog({
        error: "mAI Coder shell is unavailable.",
        experts: [],
        loadedAt: Date.now(),
        ok: false,
        repoPath: FALLBACK_BUILTIN_REPO_PATH,
      });
      return () => {
        cancelled = true;
      };
    }
    void shell
      .invoke("team:getBuiltinCatalog")
      .then((payload) => {
        if (cancelled) {
          return;
        }
        if (
          payload &&
          typeof payload === "object" &&
          Array.isArray((payload as BuiltinTeamCatalogPayload).experts)
        ) {
          setBuiltinCatalog(payload as BuiltinTeamCatalogPayload);
          return;
        }
        setBuiltinCatalog({
          error: "Unexpected built-in team response.",
          experts: [],
          loadedAt: Date.now(),
          ok: false,
          repoPath: FALLBACK_BUILTIN_REPO_PATH,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setBuiltinCatalog({
          error: error instanceof Error ? error.message : String(error),
          experts: [],
          loadedAt: Date.now(),
          ok: false,
          repoPath: FALLBACK_BUILTIN_REPO_PATH,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const builtinExperts = builtinCatalog?.experts ?? [];
  const builtinLeader =
    builtinExperts.find((expert) => expert.roleType === "team_lead") ?? null;
  const builtinGlobalModelId = value.builtinGlobalModelId?.trim() ?? "";
  const builtinExpertModelOverrides = value.builtinExpertModelOverrides ?? {};
  const activeRoles =
    teamSource === "builtin" ? builtinExperts : customRoleList;

  const modelOptions = useMemo(
    () =>
      modelEntries.map((model) => ({
        id: model.id,
        label: model.displayName.trim() || model.requestName || model.id,
      })),
    [modelEntries]
  );
  const roleOptions = useMemo(
    () =>
      ROLE_IDS.map((roleId) => ({
        label: t(`settings.team.role.${roleId}`),
        value: roleId,
      })),
    [t]
  );
  const teamModelOptions = useMemo(
    () => [
      { label: "—", value: "" },
      ...modelOptions.map((item) => ({ label: item.label, value: item.id })),
    ],
    [modelOptions]
  );
  const builtinGlobalModelLabel = useMemo(
    () => modelDisplayText(builtinGlobalModelId, modelEntries, modelProviders),
    [builtinGlobalModelId, modelEntries, modelProviders]
  );
  const builtinGlobalModelOptions = useMemo(
    () => [
      { label: t("settings.team.builtinModelInheritSession"), value: "" },
      ...modelOptions.map((item) => ({ label: item.label, value: item.id })),
    ],
    [modelOptions, t]
  );
  const builtinRoleFallbackLabel = useMemo(
    () =>
      builtinGlobalModelLabel
        ? builtinGlobalModelLabel
        : t("settings.team.builtinModelInheritSession"),
    [builtinGlobalModelLabel, t]
  );
  const builtinRoleModelOptions = useMemo(
    () => [
      { label: builtinRoleFallbackLabel, value: "" },
      ...modelOptions.map((item) => ({ label: item.label, value: item.id })),
    ],
    [builtinRoleFallbackLabel, modelOptions]
  );
  const builtinOverrideCount = useMemo(
    () =>
      builtinExperts.filter((role) =>
        String(builtinExpertModelOverrides[role.id] ?? "").trim()
      ).length,
    [builtinExpertModelOverrides, builtinExperts]
  );
  const builtinInheritedCount = Math.max(
    0,
    builtinExperts.length - builtinOverrideCount
  );
  const reviewerModelOptions = useMemo(
    () =>
      teamSource === "builtin" ? builtinRoleModelOptions : teamModelOptions,
    [teamSource, builtinRoleModelOptions, teamModelOptions]
  );

  const switchTeamSource = (nextSource: TeamSource) => {
    if (nextSource === teamSource) {
      return;
    }
    setEditingRole(null);
    onChange({
      ...value,
      experts:
        nextSource === "custom"
          ? experts.length > 0
            ? experts.map((expert) => ({ ...expert }))
            : buildDefaultCustomTeamExperts()
          : experts.map((expert) => ({ ...expert })),
      source: nextSource,
      useDefaults: nextSource === "builtin",
      ...getTeamSourceDefaults(nextSource),
    });
  };

  const setNamedReviewer = (
    key: "planReviewer" | "deliveryReviewer",
    next: TeamExpertConfig | null
  ) => {
    onChange({
      ...value,
      [key]: next,
    });
  };

  const setBuiltinGlobalModel = (nextModelId: string) => {
    onChange({
      ...value,
      builtinGlobalModelId: nextModelId || undefined,
    });
  };

  const setBuiltinRoleModel = (expertId: string, nextModelId: string) => {
    const nextOverrides = { ...(value.builtinExpertModelOverrides ?? {}) };
    if (nextModelId) {
      nextOverrides[expertId] = nextModelId;
    } else {
      delete nextOverrides[expertId];
    }
    onChange({
      ...value,
      builtinExpertModelOverrides:
        Object.keys(nextOverrides).length > 0 ? nextOverrides : undefined,
    });
  };

  const patchNamedReviewer = (
    key: "planReviewer" | "deliveryReviewer",
    kind: "plan" | "delivery",
    patch: Partial<TeamExpertConfig>
  ) => {
    const current =
      (key === "planReviewer" ? value.planReviewer : value.deliveryReviewer) ??
      newReviewer(kind);
    setNamedReviewer(key, { ...current, ...patch });
  };

  const patchEditingRole = (patch: Partial<TeamExpertConfig>) => {
    if (editingRole) {
      setEditingRole({ ...editingRole, ...patch });
    }
  };

  const saveEditingRole = () => {
    if (!editingRole) {
      return;
    }
    const isExisting = customRoleList.some(
      (role) => role.id === editingRole.id
    );
    const nextExperts = isExisting
      ? customRoleList.map((role) =>
          role.id === editingRole.id ? editingRole : role
        )
      : [...customRoleList, editingRole];
    onChange({
      ...value,
      experts: nextExperts,
      source: "custom",
      useDefaults: false,
    });
    setEditingRole(null);
  };

  const removeRole = (id: string) => {
    onChange({
      ...value,
      experts: customRoleList.filter((role) => role.id !== id),
      source: "custom",
      useDefaults: false,
    });
    if (editingRole?.id === id) {
      setEditingRole(null);
    }
  };

  return (
    <div className="ref-settings-panel ref-settings-panel--team">
      <p className="ref-settings-lead">{t("settings.team.lead")}</p>
      <div className="ref-settings-team-shell">
        <section className="ref-settings-team-hero">
          <div>
            <div className="ref-settings-team-kicker">
              {t("settings.title.team")}
            </div>
            <h3 className="ref-settings-team-title">
              {t("settings.team.sourcesTitle")}
            </h3>
            <p className="ref-settings-team-subtitle">
              {t("settings.team.sourcesLead")}
            </p>
          </div>
          <div className="ref-settings-team-stats">
            <div className="ref-settings-team-stat">
              <span className="ref-settings-team-stat-label">
                {t("settings.team.activeSource")}
              </span>
              <strong>{t(`settings.team.source.${teamSource}`)}</strong>
            </div>
            <div className="ref-settings-team-stat">
              <span className="ref-settings-team-stat-label">
                {t("settings.team.availableRoles")}
              </span>
              <strong>{String(activeRoles.length)}</strong>
            </div>
          </div>
        </section>

        <section className="ref-settings-team-presets">
          {(["builtin", "custom"] as TeamSource[]).map((source) => {
            const selected = teamSource === source;
            const roleCount =
              source === "builtin"
                ? builtinExperts.length
                : customRoleList.length;
            return (
              <button
                className={`ref-settings-team-preset-card ${selected ? "is-active" : ""}`}
                key={source}
                onClick={() => switchTeamSource(source)}
                type="button"
              >
                <div className="ref-settings-team-preset-head">
                  <strong>{t(`settings.team.source.${source}`)}</strong>
                  <span>{roleCount} roles</span>
                </div>
                <p>{t(`settings.team.source.${source}.description`)}</p>
              </button>
            );
          })}
        </section>
      </div>

      {teamSource === "builtin" ? (
        <section className="ref-settings-team-section">
          <div className="ref-settings-team-shell ref-settings-team-shell--builtin">
            <div className="ref-settings-team-section-head">
              <div>
                <h3 className="ref-settings-team-section-title">
                  {t("settings.team.builtinRosterTitle")}
                </h3>
                <p
                  className="ref-settings-proxy-hint"
                  style={{ margin: "6px 0 0" }}
                >
                  {builtinLeader
                    ? t("settings.team.builtinLeaderHint", {
                        leader: builtinLeader.name,
                      })
                    : t("settings.team.builtinLeaderFallback")}
                </p>
              </div>
              <div className="ref-settings-team-stat ref-settings-team-stat--repo">
                <span className="ref-settings-team-stat-label">
                  {t("settings.team.builtinPath")}
                </span>
                <strong
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    wordBreak: "break-all",
                  }}
                >
                  {builtinCatalog?.repoPath ?? FALLBACK_BUILTIN_REPO_PATH}
                </strong>
              </div>
            </div>

            {builtinCatalog == null ? (
              <p className="ref-settings-proxy-hint">
                {t("settings.team.builtinLoading")}
              </p>
            ) : null}

            {builtinCatalog?.ok === false ? (
              <p className="ref-settings-proxy-hint">
                {t("settings.team.builtinLoadError", {
                  error: builtinCatalog.error,
                })}
              </p>
            ) : null}

            <div className="ref-settings-team-policy">
              <div className="ref-settings-team-policy-main">
                <div className="ref-settings-team-kicker">
                  {t("settings.team.builtinModelsTitle")}
                </div>
                <h4 className="ref-settings-team-policy-title">
                  {t("settings.team.builtinPolicyTitle")}
                </h4>
                <p className="ref-settings-team-policy-copy">
                  {t("settings.team.builtinPolicyLead")}
                </p>
                <label className="ref-settings-field ref-settings-field--compact">
                  <span>{t("settings.team.builtinGlobalModel")}</span>
                  <VoidSelect
                    ariaLabel={t("settings.team.builtinGlobalModel")}
                    onChange={(selected) =>
                      setBuiltinGlobalModel(selected || "")
                    }
                    options={builtinGlobalModelOptions}
                    value={builtinGlobalModelId}
                    variant="compact"
                  />
                </label>
                <p className="ref-settings-team-policy-hint">
                  {t("settings.team.builtinGlobalModelHint")}
                </p>
              </div>
              <div className="ref-settings-team-policy-side">
                <div className="ref-settings-team-policy-fact">
                  <span>{t("settings.team.builtinGlobalModel")}</span>
                  <strong>
                    {builtinGlobalModelLabel ??
                      t("settings.team.builtinModelInheritSession")}
                  </strong>
                </div>
                <div className="ref-settings-team-policy-pills">
                  <span className="ref-settings-team-info-pill">
                    {t("settings.team.builtinOverrideCount", {
                      count: String(builtinOverrideCount),
                    })}
                  </span>
                  <span className="ref-settings-team-info-pill">
                    {t("settings.team.builtinInheritCount", {
                      count: String(builtinInheritedCount),
                    })}
                  </span>
                </div>
                <p className="ref-settings-team-policy-hint">
                  {t("settings.team.builtinRoleModelHint")}
                </p>
              </div>
            </div>

            <div className="ref-settings-team-section-head ref-settings-team-section-head--tight">
              <div>
                <h4 className="ref-settings-team-section-subtitle">
                  {t("settings.team.builtinRoleOverridesTitle")}
                </h4>
                <p
                  className="ref-settings-proxy-hint"
                  style={{ margin: "4px 0 0" }}
                >
                  {t("settings.team.builtinRoleOverridesLead")}
                </p>
              </div>
            </div>

            <div className="ref-settings-team-badges ref-settings-team-badges--builtin">
              {builtinExperts.map((role) => {
                const overrideModelId =
                  builtinExpertModelOverrides[role.id] ?? "";
                const overrideModelLabel = modelDisplayText(
                  overrideModelId,
                  modelEntries,
                  modelProviders
                );
                const effectiveModelText =
                  overrideModelLabel ??
                  builtinGlobalModelLabel ??
                  t("settings.team.builtinModelInheritSession");
                const modelSourceText = builtinModelSourceText({
                  globalModelLabel: builtinGlobalModelLabel,
                  overrideModelId,
                  t,
                });
                return (
                  <article
                    className="ref-settings-team-badge ref-settings-team-badge--builtin"
                    key={role.id}
                  >
                    <div className="ref-settings-team-badge-header">
                      <h4 className="ref-settings-team-badge-name">
                        {role.name}
                      </h4>
                      <span className="ref-settings-team-badge-role">
                        {builtinRoleLabel(role, t)}
                      </span>
                    </div>
                    <p className="ref-settings-team-badge-summary">
                      {role.summary || role.assignmentKey}
                    </p>
                    <div className="ref-settings-team-badge-meta">
                      <code className="ref-settings-team-badge-key">
                        {role.assignmentKey}
                      </code>
                      <span className="ref-settings-team-badge-path">
                        {role.sourceRelPath}
                      </span>
                    </div>
                    <div className="ref-settings-team-model-card">
                      <div className="ref-settings-team-model-card-head">
                        <span className="ref-settings-team-model-card-label">
                          {t("settings.team.builtinEffectiveModelLabel")}
                        </span>
                        <span className="ref-settings-team-model-source">
                          {modelSourceText}
                        </span>
                      </div>
                      <div className="ref-settings-team-model-card-value">
                        {effectiveModelText}
                      </div>
                      <label className="ref-settings-field ref-settings-field--compact">
                        <span>{t("settings.team.builtinRoleModel")}</span>
                        <VoidSelect
                          ariaLabel={`${role.name} ${t("settings.team.builtinRoleModel")}`}
                          onChange={(selected) =>
                            setBuiltinRoleModel(role.id, selected || "")
                          }
                          options={builtinRoleModelOptions}
                          value={overrideModelId}
                          variant="compact"
                        />
                      </label>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <>
          {customRoleList.length === 0 ? (
            <p className="ref-settings-proxy-hint">
              {t("settings.team.empty")}
            </p>
          ) : null}
          <div className="ref-settings-team-badges">
            {customRoleList.map((role) => {
              const modelText =
                modelDisplayText(
                  role.preferredModelId,
                  modelEntries,
                  modelProviders
                ) ?? "—";

              return (
                <button
                  className="ref-settings-team-badge"
                  key={role.id}
                  onClick={() => setEditingRole(role)}
                  type="button"
                >
                  <div className="ref-settings-team-badge-header">
                    <h4 className="ref-settings-team-badge-name">
                      {role.name || t("settings.team.untitledRole")}
                    </h4>
                    <span className="ref-settings-team-badge-role">
                      {t(`settings.team.role.${role.roleType}`) ||
                        role.roleType}
                    </span>
                  </div>
                  <div className="ref-settings-team-badge-model">
                    <svg
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="14"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" x2="12" y1="22.08" y2="12" />
                    </svg>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {modelText}
                    </span>
                  </div>
                  {!role.enabled && (
                    <div
                      style={{
                        alignItems: "center",
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: "inherit",
                        bottom: 0,
                        display: "flex",
                        fontWeight: "bold",
                        justifyContent: "center",
                        left: 0,
                        position: "absolute",
                        right: 0,
                        top: 0,
                      }}
                    >
                      Disabled
                    </div>
                  )}
                </button>
              );
            })}
            <button
              className="ref-settings-team-badge is-add"
              onClick={() => setEditingRole(newRole())}
              type="button"
            >
              + {t("settings.team.addRole")}
            </button>
          </div>
        </>
      )}

      <section className="ref-settings-team-section">
        <h3
          className="ref-settings-team-section-title"
          style={{ marginBottom: 12 }}
        >
          {t("settings.team.reviewersTitle")}
        </h3>
        <div style={{ display: "grid", gap: 16 }}>
          {[
            {
              hint: t("settings.team.planReviewerHint"),
              key: "planReviewer" as const,
              kind: "plan" as const,
              label: t("settings.team.planReviewer"),
              value: value.planReviewer,
            },
            {
              hint: t("settings.team.deliveryReviewerHint"),
              key: "deliveryReviewer" as const,
              kind: "delivery" as const,
              label: t("settings.team.deliveryReviewer"),
              value: value.deliveryReviewer,
            },
          ].map((reviewerConfig) => (
            <div
              className="ref-settings-team-shell"
              key={reviewerConfig.key}
              style={{ padding: 16 }}
            >
              <div
                style={{
                  alignItems: "flex-start",
                  display: "flex",
                  gap: 16,
                  justifyContent: "space-between",
                  marginBottom: reviewerConfig.value ? 16 : 0,
                }}
              >
                <div>
                  <strong>{reviewerConfig.label}</strong>
                  <p
                    className="ref-settings-proxy-hint"
                    style={{ margin: "6px 0 0" }}
                  >
                    {reviewerConfig.value
                      ? reviewerConfig.hint
                      : t("settings.team.reviewerFallbackHint")}
                  </p>
                </div>
                <label className="ref-settings-team-inline-check">
                  <input
                    checked={Boolean(reviewerConfig.value)}
                    onChange={(event) =>
                      setNamedReviewer(
                        reviewerConfig.key,
                        event.target.checked
                          ? (reviewerConfig.value ??
                              newReviewer(reviewerConfig.kind))
                          : null
                      )
                    }
                    type="checkbox"
                  />
                  <span>{t("settings.team.customReviewerToggle")}</span>
                </label>
              </div>
              {reviewerConfig.value ? (
                <>
                  <div
                    className="ref-settings-team-role-grid"
                    style={{ marginBottom: 16 }}
                  >
                    <label className="ref-settings-field ref-settings-field--compact">
                      <span>{t("settings.team.roleName")}</span>
                      <input
                        onChange={(event) =>
                          patchNamedReviewer(
                            reviewerConfig.key,
                            reviewerConfig.kind,
                            {
                              name: event.target.value,
                            }
                          )
                        }
                        value={reviewerConfig.value.name}
                      />
                    </label>
                    <label className="ref-settings-field ref-settings-field--compact">
                      <span>{t("settings.team.model")}</span>
                      <VoidSelect
                        ariaLabel={t("settings.team.model")}
                        onChange={(selected) =>
                          patchNamedReviewer(
                            reviewerConfig.key,
                            reviewerConfig.kind,
                            {
                              preferredModelId: selected || undefined,
                            }
                          )
                        }
                        options={reviewerModelOptions}
                        value={reviewerConfig.value.preferredModelId ?? ""}
                        variant="compact"
                      />
                    </label>
                    <label
                      className="ref-settings-field ref-settings-field--compact"
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <span>{t("settings.team.toolsCsv")}</span>
                      <input
                        onChange={(event) =>
                          patchNamedReviewer(
                            reviewerConfig.key,
                            reviewerConfig.kind,
                            {
                              allowedTools: event.target.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean),
                            }
                          )
                        }
                        value={(reviewerConfig.value.allowedTools ?? []).join(
                          ", "
                        )}
                      />
                    </label>
                  </div>
                  <label className="ref-settings-field">
                    <span>{t("settings.team.prompt")}</span>
                    <textarea
                      className="ref-settings-models-search"
                      onChange={(event) =>
                        patchNamedReviewer(
                          reviewerConfig.key,
                          reviewerConfig.kind,
                          {
                            systemPrompt: event.target.value,
                          }
                        )
                      }
                      style={{ minHeight: 120, resize: "vertical" }}
                      value={reviewerConfig.value.systemPrompt}
                    />
                  </label>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {teamSource === "custom" && editingRole ? (
        <div className="modal-backdrop" onClick={() => setEditingRole(null)}>
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
            style={{ maxWidth: "90vw", width: 500 }}
          >
            <h2 style={{ fontSize: 18, marginBottom: 24 }}>
              {editingRole.name || t("settings.team.untitledRole")}
            </h2>

            <div
              className="ref-settings-team-role-head"
              style={{ marginBottom: 20 }}
            >
              <div>
                <p>{editingRole.assignmentKey || editingRole.roleType}</p>
              </div>
              <label className="ref-settings-team-inline-check">
                <input
                  checked={editingRole.enabled !== false}
                  onChange={(event) =>
                    patchEditingRole({ enabled: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>{t("settings.team.enabled")}</span>
              </label>
            </div>

            <div
              className="ref-settings-team-role-grid"
              style={{ marginBottom: 16 }}
            >
              <label className="ref-settings-field ref-settings-field--compact">
                <span>{t("settings.team.roleName")}</span>
                <input
                  onChange={(event) =>
                    patchEditingRole({ name: event.target.value })
                  }
                  placeholder={t("settings.team.untitledRole")}
                  value={editingRole.name}
                />
              </label>
              <label className="ref-settings-field ref-settings-field--compact">
                <span>{t("settings.team.roleType")}</span>
                <VoidSelect
                  ariaLabel={t("settings.team.roleType")}
                  onChange={(nextValue) =>
                    patchEditingRole({ roleType: nextValue as TeamRoleType })
                  }
                  options={roleOptions}
                  value={editingRole.roleType}
                  variant="compact"
                />
              </label>
              <label className="ref-settings-field ref-settings-field--compact">
                <span>{t("settings.team.assignmentKey")}</span>
                <input
                  onChange={(event) =>
                    patchEditingRole({ assignmentKey: event.target.value })
                  }
                  value={editingRole.assignmentKey ?? ""}
                />
              </label>
              <label className="ref-settings-field ref-settings-field--compact">
                <span>{t("settings.team.model")}</span>
                <VoidSelect
                  ariaLabel={t("settings.team.model")}
                  onChange={(nextValue) =>
                    patchEditingRole({
                      preferredModelId: nextValue || undefined,
                    })
                  }
                  options={teamModelOptions}
                  value={editingRole.preferredModelId ?? ""}
                  variant="compact"
                />
              </label>
              <label
                className="ref-settings-field ref-settings-field--compact"
                style={{ gridColumn: "1 / -1" }}
              >
                <span>{t("settings.team.toolsCsv")}</span>
                <input
                  onChange={(event) =>
                    patchEditingRole({
                      allowedTools: event.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  value={(editingRole.allowedTools ?? []).join(", ")}
                />
              </label>
            </div>

            <label className="ref-settings-field">
              <span>{t("settings.team.prompt")}</span>
              <textarea
                className="ref-settings-models-search"
                onChange={(event) =>
                  patchEditingRole({ systemPrompt: event.target.value })
                }
                style={{ minHeight: 120, resize: "vertical" }}
                value={editingRole.systemPrompt}
              />
            </label>

            <div
              className="modal-actions"
              style={{ justifyContent: "space-between", marginTop: 24 }}
            >
              <button
                className="ref-settings-remove-model"
                onClick={() => removeRole(editingRole.id)}
                type="button"
              >
                {t("settings.team.removeRole")}
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="ref-settings-remove-model"
                  onClick={() => setEditingRole(null)}
                  type="button"
                >
                  取消
                </button>
                <button
                  className="ref-settings-add-model"
                  onClick={saveEditingRole}
                  type="button"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
