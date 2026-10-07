import { type DomainFrameProps } from '../../internal/domain.js';
export interface ServerEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ServerEmptyState(props: ServerEmptyStateProps): import("react").JSX.Element;
