import { type DomainFrameProps } from '../../internal/domain.js';
export interface RouteDefinitionEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function RouteDefinitionEmptyState(props: RouteDefinitionEmptyStateProps): import("react").JSX.Element;
