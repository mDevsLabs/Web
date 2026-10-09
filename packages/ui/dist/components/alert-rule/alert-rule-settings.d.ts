import { type DomainFrameProps } from '../../internal/domain.js';
import type { AlertRuleSettingsValues } from './types.js';
export interface AlertRuleSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AlertRuleSettingsValues;
    onChange: (key: keyof AlertRuleSettingsValues, value: boolean) => void;
}
export declare function AlertRuleSettings({ onChange, ...props }: AlertRuleSettingsProps): import("react").JSX.Element;
