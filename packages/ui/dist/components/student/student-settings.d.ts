import { type DomainFrameProps } from '../../internal/domain.js';
import type { StudentSettingsValues } from './types.js';
export interface StudentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: StudentSettingsValues;
    onChange: (key: keyof StudentSettingsValues, value: boolean) => void;
}
export declare function StudentSettings({ onChange, ...props }: StudentSettingsProps): import("react").JSX.Element;
