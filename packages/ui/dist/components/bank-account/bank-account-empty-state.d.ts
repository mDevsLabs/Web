import { type DomainFrameProps } from '../../internal/domain.js';
export interface BankAccountEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function BankAccountEmptyState(props: BankAccountEmptyStateProps): import("react").JSX.Element;
