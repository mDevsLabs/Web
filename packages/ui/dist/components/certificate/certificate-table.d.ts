import { type DomainFrameProps } from '../../internal/domain.js';
import type { Certificate } from './types.js';
export interface CertificateTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Certificate[];
    emptyMessage?: string;
}
export declare function CertificateTable(props: CertificateTableProps): import("react").JSX.Element;
