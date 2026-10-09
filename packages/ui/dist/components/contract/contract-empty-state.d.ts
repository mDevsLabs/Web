import { type DomainFrameProps } from '../../internal/domain.js';
export interface ContractEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ContractEmptyState(props: ContractEmptyStateProps): import("react").JSX.Element;
