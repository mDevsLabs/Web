import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAssetSettingsValues } from './types.js';
export interface MediaAssetSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: MediaAssetSettingsValues;
    onChange: (key: keyof MediaAssetSettingsValues, value: boolean) => void;
}
export declare function MediaAssetSettings({ onChange, ...props }: MediaAssetSettingsProps): import("react").JSX.Element;
