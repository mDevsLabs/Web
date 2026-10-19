import { type DomainFrameProps } from '../../internal/domain.js';
import type { GoalSettingsValues } from './types.js';
export interface GoalSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: GoalSettingsValues;
    onChange: (key: keyof GoalSettingsValues, value: boolean) => void;
}
export declare function GoalSettings({ onChange, ...props }: GoalSettingsProps): import("react").JSX.Element;
