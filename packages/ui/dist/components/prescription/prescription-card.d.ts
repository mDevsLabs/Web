import { type DomainFrameProps } from '../../internal/domain.js';
import type { Prescription } from './types.js';
export interface PrescriptionCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Prescription;
}
export declare function PrescriptionCard(props: PrescriptionCardProps): import("react").JSX.Element;
