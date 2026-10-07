import { type DomainFrameProps } from '../../internal/domain.js';
export interface ReleaseEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ReleaseEmptyState(props: ReleaseEmptyStateProps): import("react").JSX.Element;
