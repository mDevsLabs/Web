import { type DomainFrameProps } from '../../internal/domain.js';
import type { GiftCardMetric } from './types.js';
export interface GiftCardStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly GiftCardMetric[];
}
export declare function GiftCardStats(props: GiftCardStatsProps): import("react").JSX.Element;
