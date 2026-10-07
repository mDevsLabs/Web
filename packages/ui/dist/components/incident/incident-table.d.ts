import { type DomainFrameProps } from '../../internal/domain.js';
import type { Incident } from './types.js';
export interface IncidentTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Incident[];
    emptyMessage?: string;
}
export declare function IncidentTable(props: IncidentTableProps): import("react").JSX.Element;
