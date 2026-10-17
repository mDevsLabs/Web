import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCard } from './types.js';
export interface GiftCardTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly GiftCard[];
    emptyMessage?: string;
}
export declare function GiftCardTable(props: GiftCardTableProps): import("react").JSX.Element;
