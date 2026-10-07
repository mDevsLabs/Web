import { type DomainFrameProps } from '../../internal/domain.js';
import type { ContactSettingsValues } from './types.js';
export interface ContactSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ContactSettingsValues;
    onChange: (key: keyof ContactSettingsValues, value: boolean) => void;
}
export declare function ContactSettings({ onChange, ...props }: ContactSettingsProps): import("react").JSX.Element;
