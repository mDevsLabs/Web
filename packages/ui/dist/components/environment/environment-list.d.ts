import { type DomainFrameProps } from '../../internal/domain.js';
import type { Environment } from './types.js';
export interface EnvironmentListProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly Environment[];
    onSelect?: (item: Environment) => void;
    emptyMessage?: string;
}
export declare function EnvironmentList({ onSelect, ...props }: EnvironmentListProps): import("react").JSX.Element;
