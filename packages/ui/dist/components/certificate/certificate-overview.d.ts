import { type DomainFrameProps } from '../../internal/domain.js';
import type { Certificate, CertificateMetric } from './types.js';
export interface CertificateOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Certificate[];
    metrics: readonly CertificateMetric[];
}
export declare function CertificateOverview(props: CertificateOverviewProps): import("react").JSX.Element;
