import { type DomainFrameProps } from '../../internal/domain.js';
import type { QuoteSettingsValues } from './types.js';
export interface QuoteSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: QuoteSettingsValues;
    onChange: (key: keyof QuoteSettingsValues, value: boolean) => void;
}
export declare function QuoteSettings({ onChange, ...props }: QuoteSettingsProps): import("react").JSX.Element;
