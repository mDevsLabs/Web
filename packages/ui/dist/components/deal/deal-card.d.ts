import { type DomainFrameProps } from '../../internal/domain.js';
import type { Deal } from './types.js';
export interface DealCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Deal;
}
export declare function DealCard(props: DealCardProps): import("react").JSX.Element;
