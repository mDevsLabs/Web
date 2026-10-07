import { type DomainFrameProps } from '../../internal/domain.js';
import type { Incident } from './types.js';
export interface IncidentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Incident[];
    onSelect?: (item: Incident) => void;
    emptyMessage?: string;
}
export declare function IncidentList({ onSelect, ...props }: IncidentListProps): import("react").JSX.Element;
