import { type DomainFrameProps } from '../../internal/domain.js';
import type { SavedFilterSettingsValues } from './types.js';
export interface SavedFilterSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: SavedFilterSettingsValues;
    onChange: (key: keyof SavedFilterSettingsValues, value: boolean) => void;
}
export declare function SavedFilterSettings({ onChange, ...props }: SavedFilterSettingsProps): import("react").JSX.Element;
