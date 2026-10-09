import { type DomainFrameProps } from '../../internal/domain.js';
export interface VenueEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function VenueEmptyState(props: VenueEmptyStateProps): import("react").JSX.Element;
