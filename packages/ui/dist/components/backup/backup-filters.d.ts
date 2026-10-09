import { type DomainFrameProps } from '../../internal/domain.js';
import type { BackupStatus } from './types.js';
export interface BackupFiltersProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    query: string;
    status?: BackupStatus | '';
    onQueryChange: (query: string) => void;
    onStatusChange?: (status: BackupStatus | '') => void;
}
export declare function BackupFilters({ onStatusChange, ...props }: BackupFiltersProps): import("react").JSX.Element;
