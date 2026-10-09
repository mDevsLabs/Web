import { type DomainFrameProps } from '../../internal/domain.js';
export interface CalendarEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function CalendarEmptyState(props: CalendarEmptyStateProps): import("react").JSX.Element;
