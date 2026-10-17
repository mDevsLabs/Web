import { type DomainFrameProps } from '../../internal/domain.js';
import type { MedicalAppointmentActivity } from './types.js';
export interface MedicalAppointmentTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly MedicalAppointmentActivity[];
    emptyMessage?: string;
}
export declare function MedicalAppointmentTimeline(props: MedicalAppointmentTimelineProps): import("react").JSX.Element;
