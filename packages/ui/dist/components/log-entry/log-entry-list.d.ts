import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntry } from './types.js';
export interface LogEntryListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly LogEntry[];
    onSelect?: (item: LogEntry) => void;
    emptyMessage?: string;
}
export declare function LogEntryList({ onSelect, ...props }: LogEntryListProps): import("react").JSX.Element;
