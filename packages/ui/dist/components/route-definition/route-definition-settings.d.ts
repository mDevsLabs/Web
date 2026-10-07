import { type DomainFrameProps } from '../../internal/domain.js';
import type { RouteDefinitionSettingsValues } from './types.js';
export interface RouteDefinitionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: RouteDefinitionSettingsValues;
    onChange: (key: keyof RouteDefinitionSettingsValues, value: boolean) => void;
}
export declare function RouteDefinitionSettings({ onChange, ...props }: RouteDefinitionSettingsProps): import("react").JSX.Element;
