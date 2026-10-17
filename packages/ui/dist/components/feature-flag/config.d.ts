export declare const config: {
    readonly name: "FeatureFlag";
    readonly label: "Fonctionnalités expérimentales";
    readonly description: "Gérez vos fonctionnalités expérimentales depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "key";
        readonly label: "Clé";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "rolloutPercent";
        readonly label: "Déploiement (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "owner";
        readonly label: "Responsable";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["enabled", "disabled", "testing"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyFeatureFlag";
        readonly label: "Notifications : fonctionnalités expérimentales";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveFeatureFlag";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section fonctionnalités expérimentales.";
    }, {
        readonly key: "approveFeatureFlag";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
