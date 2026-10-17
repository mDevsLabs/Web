import { type DomainFrameProps } from '../../internal/domain.js';
import type { Organization, OrganizationMetric } from './types.js';
export interface OrganizationOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Organization[];
    metrics: readonly OrganizationMetric[];
}
export declare function OrganizationOverview(props: OrganizationOverviewProps): import("react").JSX.Element;
