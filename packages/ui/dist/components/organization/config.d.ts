export declare const config: {
    readonly name: "Organization";
    readonly label: "Organisations";
    readonly description: "Gérez vos organisations depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "industry";
        readonly label: "Secteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "employeeCount";
        readonly label: "Collaborateurs";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "country";
        readonly label: "Pays";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "pending", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyOrganization";
        readonly label: "Notifications : organisations";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveOrganization";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section organisations.";
    }, {
        readonly key: "approveOrganization";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
