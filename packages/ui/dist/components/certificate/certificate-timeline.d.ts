import { type DomainFrameProps } from '../../internal/domain.js';
import type { CertificateActivity } from './types.js';
export interface CertificateTimelineProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    events: readonly CertificateActivity[];
    emptyMessage?: string;
}
export declare function CertificateTimeline(props: CertificateTimelineProps): import("react").JSX.Element;
