import { type DomainFrameProps } from '../../internal/domain.js';
export interface PayrollEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function PayrollEmptyState(props: PayrollEmptyStateProps): import("react").JSX.Element;
