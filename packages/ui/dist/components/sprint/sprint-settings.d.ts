import { type DomainFrameProps } from '../../internal/domain.js';
import type { SprintSettingsValues } from './types.js';
export interface SprintSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SprintSettingsValues;
    onChange: (key: keyof SprintSettingsValues, value: boolean) => void;
}
export declare function SprintSettings({ onChange, ...props }: SprintSettingsProps): import("react").JSX.Element;
