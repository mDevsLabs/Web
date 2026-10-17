import { type DomainFrameProps } from '../../internal/domain.js';
import type { CertificateMetric } from './types.js';
export interface CertificateStatsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    metrics: readonly CertificateMetric[];
}
export declare function CertificateStats(props: CertificateStatsProps): import("react").JSX.Element;
