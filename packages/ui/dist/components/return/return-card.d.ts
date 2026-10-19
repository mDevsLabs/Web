import { type DomainFrameProps } from '../../internal/domain.js';
import type { Return } from './types.js';
export interface ReturnCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Return;
}
export declare function ReturnCard(props: ReturnCardProps): import("react").JSX.Element;
