export interface UploadProgressProps {
    name: string;
    progress: number;
    status?: 'uploading' | 'complete' | 'error';
    onCancel?: () => void;
}
export declare function UploadProgress({ name, progress, status, onCancel }: UploadProgressProps): import("react").JSX.Element;
