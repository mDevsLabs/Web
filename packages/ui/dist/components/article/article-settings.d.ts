import { type DomainFrameProps } from '../../internal/domain.js';
import type { ArticleSettingsValues } from './types.js';
export interface ArticleSettingsProps extends Omit<DomainFrameProps, 'children' | 'onSelect' | 'onChange' | 'onSubmit'> {
    values: ArticleSettingsValues;
    onChange: (key: keyof ArticleSettingsValues, value: boolean) => void;
}
export declare function ArticleSettings({ onChange, ...props }: ArticleSettingsProps): import("react").JSX.Element;
