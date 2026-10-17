import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReport, TaxReportMetric } from './types.js';
export interface TaxReportOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TaxReport[];
    metrics: readonly TaxReportMetric[];
}
export declare function TaxReportOverview(props: TaxReportOverviewProps): import("react").JSX.Element;
