import { type DomainFrameProps } from '../../internal/domain.js';
export interface InvoiceEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function InvoiceEmptyState(props: InvoiceEmptyStateProps): import("react").JSX.Element;
