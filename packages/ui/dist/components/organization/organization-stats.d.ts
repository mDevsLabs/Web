import { type DomainFrameProps } from '../../internal/domain.js';
import type { OrganizationMetric } from './types.js';
export interface OrganizationStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly OrganizationMetric[];
}
export declare function OrganizationStats(props: OrganizationStatsProps): import("react").JSX.Element;
