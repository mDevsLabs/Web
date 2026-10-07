import { type DomainFrameProps } from '../../internal/domain.js';
import type { ServerMetric } from './types.js';
export interface ServerStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ServerMetric[];
}
export declare function ServerStats(props: ServerStatsProps): import("react").JSX.Element;
