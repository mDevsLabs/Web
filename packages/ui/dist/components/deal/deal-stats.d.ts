import { type DomainFrameProps } from '../../internal/domain.js';
import type { DealMetric } from './types.js';
export interface DealStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly DealMetric[];
}
export declare function DealStats(props: DealStatsProps): import("react").JSX.Element;
