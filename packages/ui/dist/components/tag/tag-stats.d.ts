import { type DomainFrameProps } from '../../internal/domain.js';
import type { TagMetric } from './types.js';
export interface TagStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TagMetric[];
}
export declare function TagStats(props: TagStatsProps): import("react").JSX.Element;
