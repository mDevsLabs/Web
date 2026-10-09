import { type DomainFrameProps } from '../../internal/domain.js';
import type { Incident, IncidentMetric } from './types.js';
export interface IncidentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Incident[];
    metrics: readonly IncidentMetric[];
}
export declare function IncidentOverview(props: IncidentOverviewProps): import("react").JSX.Element;
