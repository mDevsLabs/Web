import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReport } from './types.js';
export interface TaxReportCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: TaxReport;
}
export declare function TaxReportCard(props: TaxReportCardProps): import("react").JSX.Element;
