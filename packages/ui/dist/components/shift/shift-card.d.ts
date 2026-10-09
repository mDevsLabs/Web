import { type DomainFrameProps } from '../../internal/domain.js';
import type { Shift } from './types.js';
export interface ShiftCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Shift;
}
export declare function ShiftCard(props: ShiftCardProps): import("react").JSX.Element;
