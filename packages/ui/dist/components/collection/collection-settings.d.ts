import { type DomainFrameProps } from '../../internal/domain.js';
import type { CollectionSettingsValues } from './types.js';
export interface CollectionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CollectionSettingsValues;
    onChange: (key: keyof CollectionSettingsValues, value: boolean) => void;
}
export declare function CollectionSettings({ onChange, ...props }: CollectionSettingsProps): import("react").JSX.Element;
