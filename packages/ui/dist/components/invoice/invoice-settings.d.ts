import { type DomainFrameProps } from '../../internal/domain.js';
import type { InvoiceSettingsValues } from './types.js';
export interface InvoiceSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: InvoiceSettingsValues;
    onChange: (key: keyof InvoiceSettingsValues, value: boolean) => void;
}
export declare function InvoiceSettings({ onChange, ...props }: InvoiceSettingsProps): import("react").JSX.Element;
