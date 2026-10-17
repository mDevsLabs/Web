import { type DomainFrameProps } from '../../internal/domain.js';
import type { Document, DocumentMetric } from './types.js';
export interface DocumentOverviewProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Document[];
    metrics: readonly DocumentMetric[];
}
export declare function DocumentOverview(props: DocumentOverviewProps): import("react").JSX.Element;
