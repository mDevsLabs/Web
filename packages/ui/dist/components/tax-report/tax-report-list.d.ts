import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReport } from './types.js';
export interface TaxReportListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly TaxReport[];
    onSelect?: (item: TaxReport) => void;
    emptyMessage?: string;
}
export declare function TaxReportList({ onSelect, ...props }: TaxReportListProps): import("react").JSX.Element;
