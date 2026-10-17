export declare const config: {
    readonly name: "Repository";
    readonly label: "Dépôts de code";
    readonly description: "Gérez vos dépôts de code depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Propriétaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "branch";
        readonly label: "Branche";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "starCount";
        readonly label: "Étoiles";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["public", "private", "archived"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyRepository";
        readonly label: "Notifications : dépôts de code";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveRepository";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section dépôts de code.";
    }, {
        readonly key: "approveRepository";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
