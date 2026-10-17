import { type DomainFrameProps } from '../../internal/domain.js';
import type { IncidentSettingsValues } from './types.js';
export interface IncidentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: IncidentSettingsValues;
    onChange: (key: keyof IncidentSettingsValues, value: boolean) => void;
}
export declare function IncidentSettings({ onChange, ...props }: IncidentSettingsProps): import("react").JSX.Element;
