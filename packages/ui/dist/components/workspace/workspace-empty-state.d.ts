import { type DomainFrameProps } from '../../internal/domain.js';
export interface WorkspaceEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function WorkspaceEmptyState(props: WorkspaceEmptyStateProps): import("react").JSX.Element;
