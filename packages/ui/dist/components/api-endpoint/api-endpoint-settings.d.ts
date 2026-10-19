import { type DomainFrameProps } from '../../internal/domain.js';
import type { ApiEndpointSettingsValues } from './types.js';
export interface ApiEndpointSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ApiEndpointSettingsValues;
    onChange: (key: keyof ApiEndpointSettingsValues, value: boolean) => void;
}
export declare function ApiEndpointSettings({ onChange, ...props }: ApiEndpointSettingsProps): import("react").JSX.Element;
