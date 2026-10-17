import { type DomainFrameProps } from '../../internal/domain.js';
export interface IntegrationEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function IntegrationEmptyState(props: IntegrationEmptyStateProps): import("react").JSX.Element;
