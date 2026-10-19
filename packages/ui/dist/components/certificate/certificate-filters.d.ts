import { type DomainFrameProps } from '../../internal/domain.js';
import type { CertificateStatus } from './types.js';
export interface CertificateFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: CertificateStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: CertificateStatus | '') => void;
}
export declare function CertificateFilters({ onStatusChange, ...props }: CertificateFiltersProps): import("react").JSX.Element;
