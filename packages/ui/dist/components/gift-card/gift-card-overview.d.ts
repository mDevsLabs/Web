import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCard, GiftCardMetric } from './types.js';
export interface GiftCardOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly GiftCard[];
    metrics: readonly GiftCardMetric[];
}
export declare function GiftCardOverview(props: GiftCardOverviewProps): import("react").JSX.Element;
