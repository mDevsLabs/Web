export declare const config: {
    readonly name: "AlertRule";
    readonly label: "Règles d’alerte";
    readonly description: "Gérez vos règles d’alerte depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "metric";
        readonly label: "Métrique";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "threshold";
        readonly label: "Seuil";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "channel";
        readonly label: "Canal";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "muted", "disabled"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyAlertRule";
        readonly label: "Notifications : règles d’alerte";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveAlertRule";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section règles d’alerte.";
    }, {
        readonly key: "approveAlertRule";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
