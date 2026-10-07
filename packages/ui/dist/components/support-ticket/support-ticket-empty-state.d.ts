import { type DomainFrameProps } from '../../internal/domain.js';
export interface SupportTicketEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function SupportTicketEmptyState(props: SupportTicketEmptyStateProps): import("react").JSX.Element;
