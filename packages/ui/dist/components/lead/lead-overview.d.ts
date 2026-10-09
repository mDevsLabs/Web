import { type DomainFrameProps } from '../../internal/domain.js';
import type { Lead, LeadMetric } from './types.js';
export interface LeadOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Lead[];
    metrics: readonly LeadMetric[];
}
export declare function LeadOverview(props: LeadOverviewProps): import("react").JSX.Element;
