import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { mergeMcpSecrets } from "@/lib/mcp/secrets-config";
import {
  buildMcpTemplateEntries,
  filterMcpTemplates,
  getMcpTemplate,
  MCP_TEMPLATE_IDS,
  MCP_TEMPLATE_LIST,
  matchesMcpTemplateQuery,
} from "@/lib/mcp-templates/catalog";
import {
  splitTemplateArgs,
  templateRequiresConfiguration,
} from "@/lib/mcp-templates/install";
import { isLucideIconName } from "@/lib/plugins/icon-allowlist";

// Le catalogue MCP est une source de vérité statique : ces tests garantissent
// qu'aucun modèle ne peut être fictif, exposé sans documentation, ni porter un
// secret en clair. Tout écart doit casser la CI, pas l'utilisateur.

const SECRET_LIKE = /(sk_(live|test)_|ghp_|github_pat_|ntn_|sbp_|xox[baprs]-)/i;
const DANGEROUS_COMMAND =
  /\b(docker|kubectl|sudo|aws|gcloud|az|rm\s+-rf|sh\s+-c|bash\s+-c|curl|wget)\b/i;

describe("Catalogue de modèles MCP", () => {
  it("expose des identifiants et des noms uniques", () => {
    const ids = MCP_TEMPLATE_LIST.map((template) => template.id);
    const names = MCP_TEMPLATE_LIST.map((template) => template.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(MCP_TEMPLATE_IDS).toEqual(ids);
  });

  it("ne contient que des modèles réellement documentés et sécurisés", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      // Identité et documentation officielle.
      expect(template.author).toBeTruthy();
      expect(template.description.length).toBeGreaterThan(20);
      expect(template.docsUrl).toMatch(/^https:\/\//);
      expect(template.docsUrl).not.toMatch(/example\.(com|org|net)|localhost/i);
      expect(template.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(template.tags.length).toBeGreaterThan(0);

      // Icône whitelistée : jamais de repli silencieux dans l'interface.
      expect(isLucideIconName(template.icon.name)).toBe(true);

      // Réservé aux forfaits payants.
      expect(["plus", "pro", "max"]).toContain(template.minTier);

      // Politique d'approbation cohérente : un serveur strictement en lecture
      // ne peut pas exiger une approbation par écriture.
      if (template.readOnly) {
        expect(template.requireApproval).toBe("always_allow");
      }

      // Transport complet : une URL pour les transports distants, une commande
      // pour stdio.
      if (template.transport === "stdio") {
        expect(template.command).toBeTruthy();
        expect(template.url ?? "").toBe("");
      } else {
        expect(template.url).toMatch(/^https:\/\//);
      }
      expect(template.url ?? "").not.toMatch(/example\.|localhost/i);

      // Aucune commande dangereuse, aucun secret dans les arguments.
      expect(template.command ?? "").not.toMatch(DANGEROUS_COMMAND);
      expect(template.args ?? "").not.toMatch(DANGEROUS_COMMAND);
      expect(template.args ?? "").not.toMatch(SECRET_LIKE);
      expect(JSON.stringify(template.args ?? "")).not.toMatch(
        /token=|apikey=|api_key=|password=/i
      );

      // `env` ne porte que des variables non sensibles : une valeur opaque
      // longue serait un secret en clair.
      for (const [key, value] of Object.entries(template.env ?? {})) {
        expect(value).not.toMatch(SECRET_LIKE);
        expect(value.length).toBeLessThan(24);
        expect(key).not.toMatch(/TOKEN|SECRET|PASSWORD|KEY/i);
      }
    }
  });

  it("déclare des credentials documentés pour chaque intégration à token", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      for (const credential of template.credentials) {
        expect(["env", "auth", "header"]).toContain(credential.kind);
        expect(credential.key).toMatch(/^[A-Za-z_][A-Za-z0-9_]*$/);
        expect(credential.label.length).toBeGreaterThan(3);
        expect(credential.instructions.length).toBeGreaterThan(30);
        expect(credential.docsUrl).toMatch(/^https:\/\//);
        expect(credential.docsUrl).not.toMatch(/example\.|localhost/i);
      }

      // Un modèle OAuth interactif n'est pas installable : il ne doit donc pas
      // demander de token personnel (sinon un bouton inerte apparaîtrait).
      if (template.activation === "requires_oauth_flow") {
        expect(template.authType).toBe("oauth2");
        expect(template.credentials).toHaveLength(0);
      }
    }
  });

  it("réserve les modèles d'écriture à une approbation explicite", () => {
    for (const template of MCP_TEMPLATE_LIST) {
      if (!template.readOnly) {
        expect(["ask_permission", "write_only"]).toContain(
          template.requireApproval
        );
      }
    }
  });

  it("expose les cinq connecteurs du Store, tous installables", () => {
    const storeIds = ["github", "notion", "brave-search", "supabase", "stripe"];
    for (const id of storeIds) {
      const template = getMcpTemplate(id);
      expect(template, `modèle ${id} absent du catalogue`).toBeDefined();
      expect(template?.activation).toBe("ready");
    }
    expect(getMcpTemplate("modele-qui-nexiste-pas")).toBeUndefined();
  });
});

describe("Recherche et appariement du catalogue MCP", () => {
  it("filtre par catégorie et par requête (y compris sur les credentials)", () => {
    const all = filterMcpTemplates(MCP_TEMPLATE_LIST, "", null);
    expect(all).toHaveLength(MCP_TEMPLATE_LIST.length);

    const dataTemplates = filterMcpTemplates(MCP_TEMPLATE_LIST, "", "data");
    expect(dataTemplates.length).toBeGreaterThan(0);
    expect(
      dataTemplates.every((template) => template.category === "data")
    ).toBe(true);

    const github = getMcpTemplate("github");
    expect(github).toBeDefined();
    expect(matchesMcpTemplateQuery(github!, "token")).toBe(true);
    expect(matchesMcpTemplateQuery(github!, "zzzz-inexistant")).toBe(false);
  });

  it("apparie l'état d'installation par identifiant de modèle", () => {
    const entries = buildMcpTemplateEntries([
      {
        id: "server-1",
        isEnabled: true,
        name: "Nom modifié par l'utilisateur",
        templateId: "github",
      },
    ]);
    const githubEntry = entries.find((entry) => entry.id === "github");
    expect(githubEntry?.installed).toBe(true);
    expect(githubEntry?.enabled).toBe(true);
    expect(githubEntry?.installedServerId).toBe("server-1");

    // Un modèle sans serveur correspondant n'est jamais marqué installé.
    const notionEntry = entries.find((entry) => entry.id === "notion");
    expect(notionEntry?.installed).toBe(false);
    expect(notionEntry?.installedServerId).toBeNull();
  });

  it("retombe sur le nom pour les serveurs antérieurs à la migration", () => {
    const entries = buildMcpTemplateEntries([
      { id: "server-2", isEnabled: false, name: "Notion", templateId: null },
    ]);
    const notionEntry = entries.find((entry) => entry.id === "notion");
    expect(notionEntry?.installed).toBe(true);
    expect(notionEntry?.enabled).toBe(false);
  });
});

describe("Préparation d'installation d'un modèle MCP", () => {
  it("découpe les arguments stdio sans jamais inventer de valeur", () => {
    expect(splitTemplateArgs(undefined)).toEqual([]);
    expect(splitTemplateArgs("")).toEqual([]);
    expect(splitTemplateArgs("-y @stripe/mcp")).toEqual(["-y", "@stripe/mcp"]);
  });

  it("signale les modèles qui exigent une configuration avant activation", () => {
    expect(templateRequiresConfiguration(getMcpTemplate("github")!)).toBe(true);
    expect(templateRequiresConfiguration(getMcpTemplate("notion")!)).toBe(true);
  });
});

describe("Injection des secrets MCP à l'appel", () => {
  it("place chaque secret dans la destination déclarée par le modèle", () => {
    const merged = mergeMcpSecrets({
      authConfig: {},
      authType: "bearer",
      env: { NON_SENSIBLE: "1" },
      headers: {},
      secrets: [
        { key: "GITHUB_TOKEN", kind: "env", value: "secret-env" },
        { key: "Authorization", kind: "header", value: "Bearer secret-header" },
        { key: "token", kind: "auth", value: "secret-auth" },
      ],
    });
    expect(merged.env).toEqual({
      GITHUB_TOKEN: "secret-env",
      NON_SENSIBLE: "1",
    });
    expect(merged.headers).toEqual({ Authorization: "Bearer secret-header" });
    expect(merged.authConfig).toEqual({ token: "secret-auth" });
  });

  it("ne fabrique jamais de placeholder quand aucun secret n'est fourni", () => {
    const merged = mergeMcpSecrets({
      authConfig: {},
      authType: "bearer",
      env: { SEULEMENT_NON_SENSIBLE: "ok" },
      headers: {},
      secrets: [],
    });
    expect(merged.env).toEqual({ SEULEMENT_NON_SENSIBLE: "ok" });
    expect(merged.authConfig).toEqual({});
    expect(merged.headers).toEqual({});
  });

  it("route les secrets basic/custom_headers vers le bon emplacement", () => {
    const basic = mergeMcpSecrets({
      authType: "basic",
      secrets: [
        { key: "username", kind: "auth", value: "u" },
        { key: "password", kind: "auth", value: "p" },
      ],
    });
    expect(basic.authConfig).toEqual({ password: "p", username: "u" });

    const custom = mergeMcpSecrets({
      authType: "custom_headers",
      secrets: [{ key: "X-Api-Key", kind: "auth", value: "v" }],
    });
    expect(custom.headers).toEqual({ "X-Api-Key": "v" });
  });
});

describe("Aucun catalogue MCP concurrent", () => {
  it("ne lit plus les fichiers de seed supprimés", () => {
    const root = path.resolve(import.meta.dirname, "../..");
    for (const relative of [
      "lib/db/seeds/mcp-templates.json",
      "lib/db/seeds/skill-templates.json",
    ]) {
      expect(() => readFileSync(path.join(root, relative))).toThrow();
    }

    const catalogSource = readFileSync(
      path.join(root, "app/(chat)/api/mcp/templates/route.ts"),
      "utf8"
    );
    expect(catalogSource).toContain("MCP_TEMPLATE_LIST");
    expect(catalogSource).not.toContain("getMcpTemplateById");
  });
});
