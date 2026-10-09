import { type DomainFrameProps } from '../../internal/domain.js';
import type { ExamSettingsValues } from './types.js';
export interface ExamSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ExamSettingsValues;
    onChange: (key: keyof ExamSettingsValues, value: boolean) => void;
}
export declare function ExamSettings({ onChange, ...props }: ExamSettingsProps): import("react").JSX.Element;
