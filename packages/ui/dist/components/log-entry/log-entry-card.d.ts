import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntry } from './types.js';
export interface LogEntryCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: LogEntry;
}
export declare function LogEntryCard(props: LogEntryCardProps): import("react").JSX.Element;
