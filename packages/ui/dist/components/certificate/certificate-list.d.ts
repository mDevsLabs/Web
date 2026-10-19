import { type DomainFrameProps } from '../../internal/domain.js';
import type { Certificate } from './types.js';
export interface CertificateListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Certificate[];
    onSelect?: (item: Certificate) => void;
    emptyMessage?: string;
}
export declare function CertificateList({ onSelect, ...props }: CertificateListProps): import("react").JSX.Element;
