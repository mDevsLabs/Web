import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from "react";

/**
 * DEV 模式性能探针：用 React.Profiler 包裹热渲染路径，仅当 commit 渲染耗时超过阈值才落日志。
 *
 * 目的：继 P0（streaming 外化）之后，作为可选的诊断工具定位下一批瓶颈；
 * 生产构建下完全退化为直通，没有任何运行时开销。
 *
 * 阈值默认 8ms（一帧 16.6ms 的一半）；phase 为 `update` 的缓慢提交才真正影响用户体验，
 * 首次 mount / nested-update 通常可忽略。
 */
const SLOW_COMMIT_THRESHOLD_MS = 8;

type DevProfilerProps = {
  id: string;
  children: ReactNode;
  thresholdMs?: number;
};

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (actualDuration < SLOW_COMMIT_THRESHOLD_MS) return;
  void baseDuration;
  void startTime;
  void commitTime;
  console.log(
    `[perf][profiler] ${id} ${phase} commit=${actualDuration.toFixed(1)}ms`
  );
};

export function DevProfiler({ id, children, thresholdMs }: DevProfilerProps) {
  if (!import.meta.env.DEV) {
    return <>{children}</>;
  }
  if (thresholdMs !== undefined && thresholdMs !== SLOW_COMMIT_THRESHOLD_MS) {
    // 低频使用的自定义阈值路径：保持简单，内联一个函数避免全局 state。
    const cb: ProfilerOnRenderCallback = (pid, phase, actualDuration) => {
      if (actualDuration < thresholdMs) return;
      console.log(
        `[perf][profiler] ${pid} ${phase} commit=${actualDuration.toFixed(1)}ms`
      );
    };
    return (
      <Profiler id={id} onRender={cb}>
        {children}
      </Profiler>
    );
  }
  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
