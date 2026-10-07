import type { MutableRefObject } from "react";
import {
  createEmptyLiveAgentBlocks,
  type LiveAgentBlocksState,
} from "./liveAgentBlocks";
import { streamingStore } from "./streamingStore";

/** 离屏线程上累积的流式草稿（正文串 + 思考串 + 结构化 live blocks） */
export type OffThreadStreamDraft = {
  streaming: string;
  streamingThinking: string;
  liveAssistantBlocks: LiveAgentBlocksState;
};

/**
 * 在切换离开某线程之前，把当前可见的流式缓冲快照到该线程的离屏草稿里。
 * 否则「可见态」内容只存在于 streamingStore，切走后会被 reset 丢掉，只能靠切走后到达的 delta 补不全。
 */
export function snapshotInflightStoreIntoDraft(params: {
  leavingThreadId: string | null;
  selectedThreadId: string;
  ipcInflightThreadId: string | null;
  draftsRef: MutableRefObject<Record<string, OffThreadStreamDraft>>;
}): void {
  const { leavingThreadId, selectedThreadId, ipcInflightThreadId, draftsRef } =
    params;
  if (!leavingThreadId || leavingThreadId === selectedThreadId) {
    return;
  }
  if (ipcInflightThreadId !== leavingThreadId) {
    return;
  }
  streamingStore.flush();
  draftsRef.current[leavingThreadId] = {
    liveAssistantBlocks: structuredClone(
      streamingStore.getLiveAssistantBlocks()
    ),
    streaming: streamingStore.getStreaming(),
    streamingThinking: streamingStore.getStreamingThinking(),
  };
}

/** 将仅有字符串字段的旧草稿补齐 liveAssistantBlocks，便于与快照合并 */
export function ensureDraftHasLiveBlocks(
  row: Partial<OffThreadStreamDraft> & {
    streaming: string;
    streamingThinking: string;
  }
): OffThreadStreamDraft {
  if (
    row.liveAssistantBlocks &&
    Array.isArray(row.liveAssistantBlocks.blocks)
  ) {
    return row as OffThreadStreamDraft;
  }
  return {
    liveAssistantBlocks: createEmptyLiveAgentBlocks(),
    streaming: row.streaming,
    streamingThinking: row.streamingThinking,
  };
}
