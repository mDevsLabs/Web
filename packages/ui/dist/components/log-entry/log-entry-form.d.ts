import { type DomainFrameProps } from '../../internal/domain.js';
import type { LogEntry } from './types.js';
export interface LogEntryFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<LogEntry>;
    onSubmit: (value: Omit<LogEntry, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function LogEntryForm({ onSubmit, ...props }: LogEntryFormProps): import("react").JSX.Element;
