import { type DomainFrameProps } from '../../internal/domain.js';
import type { AssignmentSettingsValues } from './types.js';
export interface AssignmentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AssignmentSettingsValues;
    onChange: (key: keyof AssignmentSettingsValues, value: boolean) => void;
}
export declare function AssignmentSettings({ onChange, ...props }: AssignmentSettingsProps): import("react").JSX.Element;
