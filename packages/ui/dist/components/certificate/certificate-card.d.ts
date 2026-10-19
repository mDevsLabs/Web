import { type DomainFrameProps } from '../../internal/domain.js';
import type { Certificate } from './types.js';
export interface CertificateCardProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    item: Certificate;
}
export declare function CertificateCard(props: CertificateCardProps): import("react").JSX.Element;
