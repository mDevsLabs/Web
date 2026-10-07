import { type DomainFrameProps } from '../../internal/domain.js';
export interface BookingEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function BookingEmptyState(props: BookingEmptyStateProps): import("react").JSX.Element;
