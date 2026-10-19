import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReport } from './types.js';
export interface TaxReportTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TaxReport[];
    emptyMessage?: string;
}
export declare function TaxReportTable(props: TaxReportTableProps): import("react").JSX.Element;
