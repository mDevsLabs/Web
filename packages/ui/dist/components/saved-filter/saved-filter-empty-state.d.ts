import { type DomainFrameProps } from '../../internal/domain.js';
export interface SavedFilterEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function SavedFilterEmptyState(props: SavedFilterEmptyStateProps): import("react").JSX.Element;
