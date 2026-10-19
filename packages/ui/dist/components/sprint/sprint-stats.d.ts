import { type DomainFrameProps } from '../../internal/domain.js';
import type { SprintMetric } from './types.js';
export interface SprintStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly SprintMetric[];
}
export declare function SprintStats(props: SprintStatsProps): import("react").JSX.Element;
