import type { DomainActivity, DomainMetric } from '../../internal/domain.js';
export type Repository = {
    id?: string;
    name: string;
    owner: string;
    branch: string;
    starCount: number;
    status: "public" | "private" | "archived";
};
export type RepositoryStatus = Repository['status'];
export interface RepositoryActivity extends DomainActivity {
    repositoryId?: string;
}
export type RepositoryMetric = Omit<DomainMetric, 'id'> & {
    id: 'totalRepository' | 'activeRepository' | 'valueRepository';
};
export type RepositorySettingsValues = Partial<Record<"notifyRepository" | "archiveRepository" | "approveRepository", boolean>>;
