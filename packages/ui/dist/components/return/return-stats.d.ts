import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReturnMetric } from './types.js';
export interface ReturnStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ReturnMetric[];
}
export declare function ReturnStats(props: ReturnStatsProps): import("react").JSX.Element;
