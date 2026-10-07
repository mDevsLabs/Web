import { type DomainFrameProps } from '../../internal/domain.js';
export interface LogEntryEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function LogEntryEmptyState(props: LogEntryEmptyStateProps): import("react").JSX.Element;
