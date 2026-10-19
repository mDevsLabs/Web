import { type DomainFrameProps } from '../../internal/domain.js';
import type { DealSettingsValues } from './types.js';
export interface DealSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DealSettingsValues;
    onChange: (key: keyof DealSettingsValues, value: boolean) => void;
}
export declare function DealSettings({ onChange, ...props }: DealSettingsProps): import("react").JSX.Element;
