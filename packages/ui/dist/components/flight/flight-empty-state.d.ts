import { type DomainFrameProps } from '../../internal/domain.js';
export interface FlightEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function FlightEmptyState(props: FlightEmptyStateProps): import("react").JSX.Element;
