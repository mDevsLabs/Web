import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCard } from './types.js';
export interface GiftCardCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: GiftCard;
}
export declare function GiftCardCard(props: GiftCardCardProps): import("react").JSX.Element;
