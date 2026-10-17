import * as lark from "@larksuiteoapi/node-sdk";
import { session } from "electron";
import type { AppLocale } from "../../src/i18n/types.js";
import type { BotIntegrationConfig } from "../botSettingsTypes.js";
import {
  electronProxyRulesFromUrl,
  requestJson,
  resolveIntegrationProxyUrl,
} from "./platforms/common.js";

export type BotConnectivityResult = {
  ok: boolean;
  message: string;
};

function t(lang: AppLocale, zh: string, en: string, fr?: string): string {
  return lang === "en" ? en : lang === "fr" ? fr || en : zh;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? "Unknown error");
}

async function testTelegram(
  integration: BotIntegrationConfig,
  lang: AppLocale
): Promise<BotConnectivityResult> {
  const token = integration.telegram?.botToken?.trim() ?? "";
  if (!token) {
    return {
      message: t(lang, "缺少 Bot Token。", "Bot Token is required."),
      ok: false,
    };
  }
  const ses = session.fromPartition(
    `async-bot-test-telegram-${integration.id}`
  );
  const proxyUrl = resolveIntegrationProxyUrl(integration);
  try {
    if (proxyUrl) {
      await ses.setProxy({
        mode: "fixed_servers",
        proxyRules: electronProxyRulesFromUrl(proxyUrl),
      });
    } else {
      await ses.setProxy({ mode: "direct" });
    }
    try {
      await ses.closeAllConnections();
    } catch {
      /* ignore */
    }
    const response = await ses.fetch(
      `https://api.telegram.org/bot${token}/getMe`
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = (await response.json()) as {
      ok?: boolean;
      description?: string;
      result?: { username?: string; first_name?: string };
    };
    if (!data.ok) {
      throw new Error(data.description || "getMe failed");
    }
    const username = String(data.result?.username ?? "").trim();
    const firstName = String(data.result?.first_name ?? "").trim();
    return {
      message:
        username || firstName
          ? t(
              lang,
              `Telegram 已连接：${username ? `@${username}` : firstName}`,
              `Telegram connected: ${username ? `@${username}` : firstName}`
            )
          : t(lang, "Telegram 已连接。", "Telegram connected."),
      ok: true,
    };
  } catch (error) {
    return {
      message: t(
        lang,
        `Telegram 连接失败：${normalizeErrorMessage(error)}`,
        `Telegram connection failed: ${normalizeErrorMessage(error)}`
      ),
      ok: false,
    };
  } finally {
    try {
      await ses.closeAllConnections();
    } catch {
      /* ignore */
    }
  }
}

async function testSlack(
  integration: BotIntegrationConfig,
  lang: AppLocale
): Promise<BotConnectivityResult> {
  const botToken = integration.slack?.botToken?.trim() ?? "";
  const appToken = integration.slack?.appToken?.trim() ?? "";
  if (!botToken || !appToken) {
    return {
      message: t(
        lang,
        "缺少 Slack Bot Token 或 App Token。",
        "Slack Bot Token and App Token are required."
      ),
      ok: false,
    };
  }
  const proxyUrl = resolveIntegrationProxyUrl(integration);
  try {
    const json = await requestJson<{ ok?: boolean; error?: string }>(
      "https://slack.com/api/auth.test",
      {
        body: "{}",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        method: "POST",
        proxyUrl,
      }
    );
    if (!json.ok) {
      return {
        message: t(
          lang,
          `Slack 鉴权失败：${json.error || "unknown_error"}`,
          `Slack auth failed: ${json.error || "unknown_error"}`
        ),
        ok: false,
      };
    }
    return {
      message: t(
        lang,
        "Slack 连接成功（auth.test 通过）。",
        "Slack connection successful (auth.test passed)."
      ),
      ok: true,
    };
  } catch (error) {
    return {
      message: t(
        lang,
        `Slack 连接失败：${normalizeErrorMessage(error)}`,
        `Slack connection failed: ${normalizeErrorMessage(error)}`
      ),
      ok: false,
    };
  }
}

async function testDiscord(
  integration: BotIntegrationConfig,
  lang: AppLocale
): Promise<BotConnectivityResult> {
  const token = integration.discord?.botToken?.trim() ?? "";
  if (!token) {
    return {
      message: t(
        lang,
        "缺少 Discord Bot Token。",
        "Discord Bot Token is required."
      ),
      ok: false,
    };
  }
  const proxyUrl = resolveIntegrationProxyUrl(integration);
  try {
    const json = await requestJson<{
      id?: string;
      username?: string;
      message?: string;
    }>("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${token}`,
      },
      method: "GET",
      proxyUrl,
    });
    if (!json.id) {
      return {
        message: t(
          lang,
          `Discord 鉴权失败：${json.message || "invalid token"}`,
          `Discord auth failed: ${json.message || "invalid token"}`
        ),
        ok: false,
      };
    }
    return {
      message: t(
        lang,
        `Discord 连接成功（Bot: ${json.username ?? "ok"}）。`,
        `Discord connection successful (Bot: ${json.username ?? "ok"}).`
      ),
      ok: true,
    };
  } catch (error) {
    return {
      message: t(
        lang,
        `Discord 连接失败：${normalizeErrorMessage(error)}`,
        `Discord connection failed: ${normalizeErrorMessage(error)}`
      ),
      ok: false,
    };
  }
}

async function testFeishu(
  integration: BotIntegrationConfig,
  lang: AppLocale
): Promise<BotConnectivityResult> {
  const appId = integration.feishu?.appId?.trim() ?? "";
  const appSecret = integration.feishu?.appSecret?.trim() ?? "";
  if (!appId || !appSecret) {
    return {
      message: t(
        lang,
        "缺少飞书 App ID 或 App Secret。",
        "Feishu App ID and App Secret are required."
      ),
      ok: false,
    };
  }
  try {
    const client = new lark.Client({
      appId,
      appSecret,
      appType: lark.AppType.SelfBuild,
      domain: lark.Domain.Feishu,
    });
    const res = await client.auth.tenantAccessToken.internal({
      data: {
        app_id: appId,
        app_secret: appSecret,
      },
    });
    if (res.code !== 0) {
      return {
        message: t(
          lang,
          `飞书鉴权失败：${res.msg || `code ${res.code}`}`,
          `Feishu auth failed: ${res.msg || `code ${res.code}`}`
        ),
        ok: false,
      };
    }
    return {
      message: t(
        lang,
        "飞书连接成功（获取 tenant_access_token 成功）。",
        "Feishu connection successful (tenant_access_token obtained)."
      ),
      ok: true,
    };
  } catch (error) {
    return {
      message: t(
        lang,
        `飞书连接失败：${normalizeErrorMessage(error)}`,
        `Feishu connection failed: ${normalizeErrorMessage(error)}`
      ),
      ok: false,
    };
  }
}

export async function testBotIntegrationConnection(
  integration: BotIntegrationConfig,
  lang: AppLocale
): Promise<BotConnectivityResult> {
  switch (integration.platform) {
    case "telegram":
      return await testTelegram(integration, lang);
    case "slack":
      return await testSlack(integration, lang);
    case "discord":
      return await testDiscord(integration, lang);
    case "feishu":
      return await testFeishu(integration, lang);
    default:
      return {
        message: t(
          lang,
          "暂不支持该平台的连通性测试。",
          "Connectivity tests are not supported for this platform yet."
        ),
        ok: false,
      };
  }
}
