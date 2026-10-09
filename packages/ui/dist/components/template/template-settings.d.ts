import { type DomainFrameProps } from '../../internal/domain.js';
import type { TemplateSettingsValues } from './types.js';
export interface TemplateSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TemplateSettingsValues;
    onChange: (key: keyof TemplateSettingsValues, value: boolean) => void;
}
export declare function TemplateSettings({ onChange, ...props }: TemplateSettingsProps): import("react").JSX.Element;
