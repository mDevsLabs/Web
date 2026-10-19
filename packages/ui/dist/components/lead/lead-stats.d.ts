import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeadMetric } from './types.js';
export interface LeadStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly LeadMetric[];
}
export declare function LeadStats(props: LeadStatsProps): import("react").JSX.Element;
