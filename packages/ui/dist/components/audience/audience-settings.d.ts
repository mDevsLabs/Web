import { type DomainFrameProps } from '../../internal/domain.js';
import type { AudienceSettingsValues } from './types.js';
export interface AudienceSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: AudienceSettingsValues;
    onChange: (key: keyof AudienceSettingsValues, value: boolean) => void;
}
export declare function AudienceSettings({ onChange, ...props }: AudienceSettingsProps): import("react").JSX.Element;
