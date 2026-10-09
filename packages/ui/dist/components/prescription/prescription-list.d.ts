import { type DomainFrameProps } from '../../internal/domain.js';
import type { Prescription } from './types.js';
export interface PrescriptionListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Prescription[];
    onSelect?: (item: Prescription) => void;
    emptyMessage?: string;
}
export declare function PrescriptionList({ onSelect, ...props }: PrescriptionListProps): import("react").JSX.Element;
