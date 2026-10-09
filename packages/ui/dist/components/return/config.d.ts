export declare const config: {
    readonly name: "Return";
    readonly label: "Retours";
    readonly description: "Gérez vos retours depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "orderReference";
        readonly label: "Commande";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "reason";
        readonly label: "Motif";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "refundAmount";
        readonly label: "Remboursement";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["requested", "approved", "received", "refunded"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyReturn";
        readonly label: "Notifications : retours";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveReturn";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section retours.";
    }, {
        readonly key: "approveReturn";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
