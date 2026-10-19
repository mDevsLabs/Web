import { type DomainFrameProps } from '../../internal/domain.js';
import type { CollectionMetric } from './types.js';
export interface CollectionStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CollectionMetric[];
}
export declare function CollectionStats(props: CollectionStatsProps): import("react").JSX.Element;
