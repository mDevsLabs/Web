import { type DomainFrameProps } from '../../internal/domain.js';
import type { TeamSettingsValues } from './types.js';
export interface TeamSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TeamSettingsValues;
    onChange: (key: keyof TeamSettingsValues, value: boolean) => void;
}
export declare function TeamSettings({ onChange, ...props }: TeamSettingsProps): import("react").JSX.Element;
