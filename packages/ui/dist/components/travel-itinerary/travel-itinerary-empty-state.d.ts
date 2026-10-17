import { type DomainFrameProps } from '../../internal/domain.js';
export interface TravelItineraryEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function TravelItineraryEmptyState(props: TravelItineraryEmptyStateProps): import("react").JSX.Element;
