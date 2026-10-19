import { type DomainFrameProps } from '../../internal/domain.js';
import type { Collection, CollectionMetric } from './types.js';
export interface CollectionOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Collection[];
    metrics: readonly CollectionMetric[];
}
export declare function CollectionOverview(props: CollectionOverviewProps): import("react").JSX.Element;
