export declare const config: {
    readonly name: "Payment";
    readonly label: "Paiements";
    readonly description: "Gérez vos paiements depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "payer";
        readonly label: "Payeur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "paidOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["pending", "completed", "failed", "refunded"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyPayment";
        readonly label: "Notifications : paiements";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archivePayment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section paiements.";
    }, {
        readonly key: "approvePayment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
