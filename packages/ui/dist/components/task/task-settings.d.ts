import { type DomainFrameProps } from '../../internal/domain.js';
import type { TaskSettingsValues } from './types.js';
export interface TaskSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TaskSettingsValues;
    onChange: (key: keyof TaskSettingsValues, value: boolean) => void;
}
export declare function TaskSettings({ onChange, ...props }: TaskSettingsProps): import("react").JSX.Element;
