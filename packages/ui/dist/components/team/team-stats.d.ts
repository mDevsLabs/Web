import { type DomainFrameProps } from '../../internal/domain.js';
import type { TeamMetric } from './types.js';
export interface TeamStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TeamMetric[];
}
export declare function TeamStats(props: TeamStatsProps): import("react").JSX.Element;
