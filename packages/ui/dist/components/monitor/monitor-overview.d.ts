import { type DomainFrameProps } from '../../internal/domain.js';
import type { Monitor, MonitorMetric } from './types.js';
export interface MonitorOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Monitor[];
    metrics: readonly MonitorMetric[];
}
export declare function MonitorOverview(props: MonitorOverviewProps): import("react").JSX.Element;
