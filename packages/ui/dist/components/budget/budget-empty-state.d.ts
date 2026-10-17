import { type DomainFrameProps } from '../../internal/domain.js';
export interface BudgetEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function BudgetEmptyState(props: BudgetEmptyStateProps): import("react").JSX.Element;
