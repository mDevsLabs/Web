import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shift } from './types.js';
export interface ShiftTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Shift[];
    emptyMessage?: string;
}
export declare function ShiftTable(props: ShiftTableProps): import("react").JSX.Element;
