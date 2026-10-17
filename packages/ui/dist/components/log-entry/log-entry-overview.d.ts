import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntry, LogEntryMetric } from './types.js';
export interface LogEntryOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LogEntry[];
    metrics: readonly LogEntryMetric[];
}
export declare function LogEntryOverview(props: LogEntryOverviewProps): import("react").JSX.Element;
