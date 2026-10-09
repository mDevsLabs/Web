import { type DomainFrameProps } from '../../internal/domain.js';
export interface DeploymentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function DeploymentEmptyState(props: DeploymentEmptyStateProps): import("react").JSX.Element;
