import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shift } from './types.js';
export interface ShiftListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shift[];
    onSelect?: (item: Shift) => void;
    emptyMessage?: string;
}
export declare function ShiftList({ onSelect, ...props }: ShiftListProps): import("react").JSX.Element;
