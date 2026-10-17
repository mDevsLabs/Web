import { type DomainFrameProps } from '../../internal/domain.js';
import type { Monitor } from './types.js';
export interface MonitorListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Monitor[];
    onSelect?: (item: Monitor) => void;
    emptyMessage?: string;
}
export declare function MonitorList({ onSelect, ...props }: MonitorListProps): import("react").JSX.Element;
