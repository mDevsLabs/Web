import { type DomainFrameProps } from '../../internal/domain.js';
export interface LeadEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function LeadEmptyState(props: LeadEmptyStateProps): import("react").JSX.Element;
