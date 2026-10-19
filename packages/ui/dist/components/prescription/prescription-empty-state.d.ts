import { type DomainFrameProps } from '../../internal/domain.js';
export interface PrescriptionEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function PrescriptionEmptyState(props: PrescriptionEmptyStateProps): import("react").JSX.Element;
