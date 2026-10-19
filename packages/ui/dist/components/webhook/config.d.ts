export declare const config: {
    readonly name: "Webhook";
    readonly label: "Webhooks";
    readonly description: "Gérez vos webhooks depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "url";
        readonly label: "Adresse";
        readonly kind: "url";
        readonly required: true;
    }, {
        readonly key: "deliveryCount";
        readonly label: "Livraisons";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "failureCount";
        readonly label: "Échecs";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "paused", "failing"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyWebhook";
        readonly label: "Notifications : webhooks";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveWebhook";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section webhooks.";
    }, {
        readonly key: "approveWebhook";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
