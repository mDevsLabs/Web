import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReport } from './types.js';
export interface TaxReportFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<TaxReport>;
    onSubmit: (value: Omit<TaxReport, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TaxReportForm({ onSubmit, ...props }: TaxReportFormProps): import("react").JSX.Element;
