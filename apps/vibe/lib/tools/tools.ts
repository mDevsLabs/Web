/**
 * Outils mAI — Point d'entrée groupé (réexports par module).
 * Chaque outil reste dans son fichier dédié et expose `execute` + `declaration`.
 * Le registre d'exécution canonique est lib/tools/index.ts (TOOL_EXECUTORS).
 */
export * as generateImageTool from "./generateImage.ts";
export * as searchWebTool from "./searchWeb.ts";
export * as factCheckTool from "./factCheck.ts";
export * as rewritePostTool from "./rewritePost.ts";
export * as translateTool from "./translate.ts";
export * as createPostTool from "./createPost.ts";
export * as deletePostTool from "./deletePost.ts";
export * as suggestPostTool from "./suggestPost.ts";
export * as analyzeTrendsTool from "./analyzeTrends.ts";
export * as searchPostsTool from "./searchPosts.ts";
export * as getAccountStatsTool from "./getAccountStats.ts";
export * as analyzeCreatorStatsTool from "./analyzeCreatorStats.ts";
export * as getPostStatsTool from "./getPostStats.ts";
export * as checkQuotasTool from "./checkQuotas.ts";
export * as followUserTool from "./followUser.ts";
export * as getNotificationsTool from "./getNotifications.ts";
export * as likePostTool from "./likePost.ts";
export * as sendMessageTool from "./sendMessage.ts";
export * as updateSettingsTool from "./updateSettings.ts";
export * as updateProfileTool from "./updateProfile.ts";
export * as bookmarkPostTool from "./bookmarkPost.ts";
export * as repostPostTool from "./repostPost.ts";
export * as commentPostTool from "./commentPost.ts";
