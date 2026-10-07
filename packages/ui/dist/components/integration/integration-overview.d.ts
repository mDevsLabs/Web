import { type DomainFrameProps } from '../../internal/domain.js';
import type { Integration, IntegrationMetric } from './types.js';
export interface IntegrationOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Integration[];
    metrics: readonly IntegrationMetric[];
}
export declare function IntegrationOverview(props: IntegrationOverviewProps): import("react").JSX.Element;
