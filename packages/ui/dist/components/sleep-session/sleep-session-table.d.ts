import { type DomainFrameProps } from '../../internal/domain.js';
import type { SleepSession } from './types.js';
export interface SleepSessionTableProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    items: readonly SleepSession[];
    emptyMessage?: string;
}
export declare function SleepSessionTable(props: SleepSessionTableProps): import("react").JSX.Element;
