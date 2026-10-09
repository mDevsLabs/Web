export declare const config: {
    readonly name: "Subscription";
    readonly label: "Abonnements";
    readonly description: "Gérez vos abonnements depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Offre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "subscriber";
        readonly label: "Abonné";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "monthlyPrice";
        readonly label: "Prix mensuel";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "renewsOn";
        readonly label: "Renouvellement";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["trial", "active", "paused", "cancelled"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifySubscription";
        readonly label: "Notifications : abonnements";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveSubscription";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section abonnements.";
    }, {
        readonly key: "approveSubscription";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
