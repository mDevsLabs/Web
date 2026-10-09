import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntryMetric } from './types.js';
export interface LogEntryStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly LogEntryMetric[];
}
export declare function LogEntryStats(props: LogEntryStatsProps): import("react").JSX.Element;
