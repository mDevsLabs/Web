import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReportMetric } from './types.js';
export interface TaxReportStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly TaxReportMetric[];
}
export declare function TaxReportStats(props: TaxReportStatsProps): import("react").JSX.Element;
