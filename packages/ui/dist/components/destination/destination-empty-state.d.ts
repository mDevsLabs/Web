import { type DomainFrameProps } from '../../internal/domain.js';
export interface DestinationEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function DestinationEmptyState(props: DestinationEmptyStateProps): import("react").JSX.Element;
