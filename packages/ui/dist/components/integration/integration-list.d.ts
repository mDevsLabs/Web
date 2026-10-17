import { type DomainFrameProps } from '../../internal/domain.js';
import type { Integration } from './types.js';
export interface IntegrationListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Integration[];
    onSelect?: (item: Integration) => void;
    emptyMessage?: string;
}
export declare function IntegrationList({ onSelect, ...props }: IntegrationListProps): import("react").JSX.Element;
