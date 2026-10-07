import { type DomainFrameProps } from '../../internal/domain.js';
import type { WorkoutSettingsValues } from './types.js';
export interface WorkoutSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: WorkoutSettingsValues;
    onChange: (key: keyof WorkoutSettingsValues, value: boolean) => void;
}
export declare function WorkoutSettings({ onChange, ...props }: WorkoutSettingsProps): import("react").JSX.Element;
