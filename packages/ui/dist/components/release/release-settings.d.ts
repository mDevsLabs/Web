import { type DomainFrameProps } from '../../internal/domain.js';
import type { ReleaseSettingsValues } from './types.js';
export interface ReleaseSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ReleaseSettingsValues;
    onChange: (key: keyof ReleaseSettingsValues, value: boolean) => void;
}
export declare function ReleaseSettings({ onChange, ...props }: ReleaseSettingsProps): import("react").JSX.Element;
