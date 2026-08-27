import type {
  McpJsonRpcRequest,
  McpJsonRpcResponse,
  McpServerConfig,
  McpToolCallResult,
  McpToolDefinition,
} from "./types";

function buildHeaders(config: McpServerConfig): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    ...config.headers,
  };

  if (config.authType === "bearer" && config.authConfig?.token) {
    headers.Authorization = `Bearer ${config.authConfig.token}`;
  } else if (config.authType === "oauth2" && config.authConfig?.token) {
    headers.Authorization = `Bearer ${config.authConfig.token}`;
  } else if (
    config.authType === "basic" &&
    config.authConfig?.username &&
    config.authConfig?.password
  ) {
    const creds = Buffer.from(
      `${config.authConfig.username}:${config.authConfig.password}`
    ).toString("base64");
    headers.Authorization = `Basic ${creds}`;
  }

  return headers;
}

async function sendHttpJsonRpc<T = unknown>(
  url: string,
  request: McpJsonRpcRequest,
  headers: HeadersInit,
  timeoutMs = 15_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      body: JSON.stringify(request),
      headers,
      method: "POST",
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => res.statusText);
      throw new Error(
        `Erreur serveur MCP (${res.status} ${res.statusText}): ${errorText.slice(0, 300)}`
      );
    }

    const data = (await res.json()) as McpJsonRpcResponse<T>;
    if (data.error) {
      throw new Error(`MCP Error ${data.error.code}: ${data.error.message}`);
    }

    return data.result as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Délai d'attente dépassé (${timeoutMs / 1000}s)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Exécution d'une commande locale via transport stdio
 */
async function callStdioProcess(
  command: string,
  args: string[],
  env: Record<string, string>,
  inputRpc: McpJsonRpcRequest,
  timeoutMs = 15_000
): Promise<any> {
  // En environnement Edge / Browser, stdio n'est pas supporté
  if (typeof window !== "undefined" || !process?.versions?.node) {
    throw new Error(
      "Le transport stdio est réservé à l'environnement serveur Node.js"
    );
  }

  const { spawn } = await import("node:child_process");

  return new Promise((resolve, reject) => {
    let stdoutData = "";
    let stderrData = "";
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`Timeout d'exécution stdio (${timeoutMs / 1000}s)`));
    }, timeoutMs);

    const proc = spawn(command, args, {
      env: { ...process.env, ...env },
      shell: true,
    });

    proc.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdoutData.trim()) {
        reject(
          new Error(
            `Le processus stdio s'est terminé avec le code ${code}: ${stderrData}`
          )
        );
        return;
      }

      // Parcourir les lignes stdout pour extraire la réponse JSON-RPC
      const lines = stdoutData.split("\n").filter((l) => l.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(lines[i]);
          if (parsed.jsonrpc === "2.0") {
            if (parsed.error) {
              reject(new Error(parsed.error.message));
            } else {
              resolve(parsed.result);
            }
            return;
          }
        } catch {}
      }

      reject(
        new Error(
          `Réponse invalide du serveur stdio: ${stdoutData.slice(0, 300)}`
        )
      );
    });

    // Envoyer la requête JSON-RPC sur stdin
    proc.stdin.write(`${JSON.stringify(inputRpc)}\n`);
    proc.stdin.end();
  });
}

/**
 * Récupère la liste des outils exposés par le serveur MCP
 */
export async function fetchMcpTools(
  config: McpServerConfig
): Promise<McpToolDefinition[]> {
  const req: McpJsonRpcRequest = {
    id: `list-${Date.now()}`,
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
  };

  if (config.transport === "stdio") {
    if (!config.command) {
      throw new Error("Commande manquante pour le transport stdio");
    }
    const result = await callStdioProcess(
      config.command,
      config.args ?? [],
      config.env ?? {},
      req
    );
    return (result?.tools as McpToolDefinition[]) ?? [];
  }

  if (!config.url) {
    throw new Error("URL manquante pour le serveur MCP");
  }

  const headers = buildHeaders(config);
  const result = await sendHttpJsonRpc<{ tools: McpToolDefinition[] }>(
    config.url,
    req,
    headers
  );

  return result?.tools ?? [];
}

/**
 * Appelle un outil spécifique sur le serveur MCP
 */
export async function callMcpTool(
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>
): Promise<McpToolCallResult> {
  const req: McpJsonRpcRequest = {
    id: `call-${Date.now()}`,
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      arguments: args,
      name: toolName,
    },
  };

  if (config.transport === "stdio") {
    if (!config.command) {
      throw new Error("Commande stdio manquante");
    }
    const result = await callStdioProcess(
      config.command,
      config.args ?? [],
      config.env ?? {},
      req
    );
    return result as McpToolCallResult;
  }

  if (!config.url) {
    throw new Error("URL du serveur MCP manquante");
  }

  const headers = buildHeaders(config);
  return await sendHttpJsonRpc<McpToolCallResult>(config.url, req, headers);
}

/**
 * Teste la connexion à un serveur MCP et découvre ses outils
 */
export async function testMcpConnection(config: McpServerConfig): Promise<{
  message: string;
  success: boolean;
  tools: McpToolDefinition[];
  toolsCount: number;
}> {
  try {
    const tools = await fetchMcpTools(config);
    return {
      message: `Connexion réussie ! ${tools.length} outil(s) détecté(s).`,
      success: true,
      tools,
      toolsCount: tools.length,
    };
  } catch (err: any) {
    return {
      message: `Échec de la connexion : ${err.message}`,
      success: false,
      tools: [],
      toolsCount: 0,
    };
  }
}
