import { type DomainFrameProps } from '../../internal/domain.js';
export interface AlertRuleEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function AlertRuleEmptyState(props: AlertRuleEmptyStateProps): import("react").JSX.Element;
