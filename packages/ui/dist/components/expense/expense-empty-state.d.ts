import { type DomainFrameProps } from '../../internal/domain.js';
export interface ExpenseEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ExpenseEmptyState(props: ExpenseEmptyStateProps): import("react").JSX.Element;
