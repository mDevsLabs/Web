import { type DomainFrameProps } from '../../internal/domain.js';
import type { Database } from './types.js';
export interface DatabaseTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Database[];
    emptyMessage?: string;
}
export declare function DatabaseTable(props: DatabaseTableProps): import("react").JSX.Element;
