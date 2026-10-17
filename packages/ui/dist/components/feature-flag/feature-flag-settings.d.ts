import { type DomainFrameProps } from '../../internal/domain.js';
import type { FeatureFlagSettingsValues } from './types.js';
export interface FeatureFlagSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: FeatureFlagSettingsValues;
    onChange: (key: keyof FeatureFlagSettingsValues, value: boolean) => void;
}
export declare function FeatureFlagSettings({ onChange, ...props }: FeatureFlagSettingsProps): import("react").JSX.Element;
