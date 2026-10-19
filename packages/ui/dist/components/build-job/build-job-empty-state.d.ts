import { type DomainFrameProps } from '../../internal/domain.js';
export interface BuildJobEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function BuildJobEmptyState(props: BuildJobEmptyStateProps): import("react").JSX.Element;
