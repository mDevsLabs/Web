import { type DomainFrameProps } from '../../internal/domain.js';
import type { BlogPostSettingsValues } from './types.js';
export interface BlogPostSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: BlogPostSettingsValues;
    onChange: (key: keyof BlogPostSettingsValues, value: boolean) => void;
}
export declare function BlogPostSettings({ onChange, ...props }: BlogPostSettingsProps): import("react").JSX.Element;
