import { type DomainFrameProps } from '../../internal/domain.js';
export interface MediaAssetEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function MediaAssetEmptyState(props: MediaAssetEmptyStateProps): import("react").JSX.Element;
