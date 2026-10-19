import { type DomainFrameProps } from '../../internal/domain.js';
import type { HabitSettingsValues } from './types.js';
export interface HabitSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: HabitSettingsValues;
    onChange: (key: keyof HabitSettingsValues, value: boolean) => void;
}
export declare function HabitSettings({ onChange, ...props }: HabitSettingsProps): import("react").JSX.Element;
