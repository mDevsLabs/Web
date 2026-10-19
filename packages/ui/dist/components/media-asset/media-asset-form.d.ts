import { type DomainFrameProps } from '../../internal/domain.js';
import type { MediaAsset } from './types.js';
export interface MediaAssetFormProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    initialValues?: Partial<MediaAsset>;
    onSubmit: (value: Omit<MediaAsset, 'id'>) => void;
    submitLabel?: string;
    pending?: boolean;
}
export declare function MediaAssetForm({ onSubmit, ...props }: MediaAssetFormProps): import("react").JSX.Element;
