import { type DomainFrameProps } from '../../internal/domain.js';
import type { LessonSettingsValues } from './types.js';
export interface LessonSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: LessonSettingsValues;
    onChange: (key: keyof LessonSettingsValues, value: boolean) => void;
}
export declare function LessonSettings({ onChange, ...props }: LessonSettingsProps): import("react").JSX.Element;
