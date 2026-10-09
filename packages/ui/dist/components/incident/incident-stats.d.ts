import { type DomainFrameProps } from '../../internal/domain.js';
import type { IncidentMetric } from './types.js';
export interface IncidentStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly IncidentMetric[];
}
export declare function IncidentStats(props: IncidentStatsProps): import("react").JSX.Element;
