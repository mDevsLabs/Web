import { type DomainFrameProps } from '../../internal/domain.js';
import type { CourseSettingsValues } from './types.js';
export interface CourseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CourseSettingsValues;
    onChange: (key: keyof CourseSettingsValues, value: boolean) => void;
}
export declare function CourseSettings({ onChange, ...props }: CourseSettingsProps): import("react").JSX.Element;
