import { type DomainFrameProps } from '../../internal/domain.js';
export interface RestaurantMenuEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function RestaurantMenuEmptyState(props: RestaurantMenuEmptyStateProps): import("react").JSX.Element;
