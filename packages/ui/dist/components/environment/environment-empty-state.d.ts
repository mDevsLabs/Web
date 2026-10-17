import { type DomainFrameProps } from '../../internal/domain.js';
export interface EnvironmentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function EnvironmentEmptyState(props: EnvironmentEmptyStateProps): import("react").JSX.Element;
