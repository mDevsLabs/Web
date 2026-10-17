import { type DomainFrameProps } from '../../internal/domain.js';
import type { TablePreset } from './types.js';
export interface TablePresetFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<TablePreset>;
    onSubmit: (value: Omit<TablePreset, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function TablePresetForm({ onSubmit, ...props }: TablePresetFormProps): import("react").JSX.Element;
