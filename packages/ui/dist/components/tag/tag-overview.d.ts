import { type DomainFrameProps } from '../../internal/domain.js';
import type { Tag, TagMetric } from './types.js';
export interface TagOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Tag[];
    metrics: readonly TagMetric[];
}
export declare function TagOverview(props: TagOverviewProps): import("react").JSX.Element;
