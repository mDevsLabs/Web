import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntry } from './types.js';
export interface LogEntryTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LogEntry[];
    emptyMessage?: string;
}
export declare function LogEntryTable(props: LogEntryTableProps): import("react").JSX.Element;
