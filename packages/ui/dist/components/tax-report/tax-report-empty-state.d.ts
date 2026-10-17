import { type DomainFrameProps } from '../../internal/domain.js';
export interface TaxReportEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TaxReportEmptyState(props: TaxReportEmptyStateProps): import("react").JSX.Element;
