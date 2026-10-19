import { type DomainFrameProps } from '../../internal/domain.js';
import type { LeadSettingsValues } from './types.js';
export interface LeadSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LeadSettingsValues;
    onChange: (key: keyof LeadSettingsValues, value: boolean) => void;
}
export declare function LeadSettings({ onChange, ...props }: LeadSettingsProps): import("react").JSX.Element;
