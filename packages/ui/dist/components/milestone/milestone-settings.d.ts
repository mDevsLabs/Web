import { type DomainFrameProps } from '../../internal/domain.js';
import type { MilestoneSettingsValues } from './types.js';
export interface MilestoneSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MilestoneSettingsValues;
    onChange: (key: keyof MilestoneSettingsValues, value: boolean) => void;
}
export declare function MilestoneSettings({ onChange, ...props }: MilestoneSettingsProps): import("react").JSX.Element;
