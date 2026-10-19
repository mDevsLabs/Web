export declare const config: {
    readonly name: "Deployment";
    readonly label: "Déploiements";
    readonly description: "Gérez vos déploiements depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "environment";
        readonly label: "Environnement";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "commit";
        readonly label: "Commit";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "deployedOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["queued", "running", "succeeded", "failed"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyDeployment";
        readonly label: "Notifications : déploiements";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveDeployment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section déploiements.";
    }, {
        readonly key: "approveDeployment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
