import { type DomainFrameProps } from '../../internal/domain.js';
export interface FolderEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function FolderEmptyState(props: FolderEmptyStateProps): import("react").JSX.Element;
