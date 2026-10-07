import { type DomainFrameProps } from '../../internal/domain.js';
import type { PrescriptionSettingsValues } from './types.js';
export interface PrescriptionSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: PrescriptionSettingsValues;
    onChange: (key: keyof PrescriptionSettingsValues, value: boolean) => void;
}
export declare function PrescriptionSettings({ onChange, ...props }: PrescriptionSettingsProps): import("react").JSX.Element;
