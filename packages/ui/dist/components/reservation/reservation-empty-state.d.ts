import { type DomainFrameProps } from '../../internal/domain.js';
export interface ReservationEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function ReservationEmptyState(props: ReservationEmptyStateProps): import("react").JSX.Element;
