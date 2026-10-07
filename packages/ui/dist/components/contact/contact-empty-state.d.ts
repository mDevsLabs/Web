import { type DomainFrameProps } from '../../internal/domain.js';
export interface ContactEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ContactEmptyState(props: ContactEmptyStateProps): import("react").JSX.Element;
