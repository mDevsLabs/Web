import { type DomainFrameProps } from '../../internal/domain.js';
import type { Prescription } from './types.js';
export interface PrescriptionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Prescription[];
    emptyMessage?: string;
}
export declare function PrescriptionTable(props: PrescriptionTableProps): import("react").JSX.Element;
