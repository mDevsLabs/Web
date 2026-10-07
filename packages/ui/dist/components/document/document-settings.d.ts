import { type DomainFrameProps } from '../../internal/domain.js';
import type { DocumentSettingsValues } from './types.js';
export interface DocumentSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: DocumentSettingsValues;
    onChange: (key: keyof DocumentSettingsValues, value: boolean) => void;
}
export declare function DocumentSettings({ onChange, ...props }: DocumentSettingsProps): import("react").JSX.Element;
