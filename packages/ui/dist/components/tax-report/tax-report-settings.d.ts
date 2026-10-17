import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaxReportSettingsValues } from './types.js';
export interface TaxReportSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TaxReportSettingsValues;
    onChange: (key: keyof TaxReportSettingsValues, value: boolean) => void;
}
export declare function TaxReportSettings({ onChange, ...props }: TaxReportSettingsProps): import("react").JSX.Element;
