import { type DomainFrameProps } from '../../internal/domain.js';
export interface MedicalAppointmentEmptyStateProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare function MedicalAppointmentEmptyState(props: MedicalAppointmentEmptyStateProps): import("react").JSX.Element;
