import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReleaseMetric } from './types.js';
export interface ReleaseStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly ReleaseMetric[];
}
export declare function ReleaseStats(props: ReleaseStatsProps): import("react").JSX.Element;
