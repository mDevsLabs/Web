import { type DomainFrameProps } from '../../internal/domain.js';
import type { TagSettingsValues } from './types.js';
export interface TagSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: TagSettingsValues;
    onChange: (key: keyof TagSettingsValues, value: boolean) => void;
}
export declare function TagSettings({ onChange, ...props }: TagSettingsProps): import("react").JSX.Element;
