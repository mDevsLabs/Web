import { type DomainFrameProps } from '../../internal/domain.js';
import type { CertificateSettingsValues } from './types.js';
export interface CertificateSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: CertificateSettingsValues;
    onChange: (key: keyof CertificateSettingsValues, value: boolean) => void;
}
export declare function CertificateSettings({ onChange, ...props }: CertificateSettingsProps): import("react").JSX.Element;
