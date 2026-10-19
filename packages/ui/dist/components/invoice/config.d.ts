export declare const config: {
    readonly name: "Invoice";
    readonly label: "Factures";
    readonly description: "Gérez vos factures depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "number";
        readonly label: "Numéro";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "customer";
        readonly label: "Client";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "dueDate";
        readonly label: "Échéance";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "sent", "paid", "overdue"];
    }];
    readonly titleKey: "number";
    readonly settings: readonly [{
        readonly key: "notifyInvoice";
        readonly label: "Notifications : factures";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveInvoice";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section factures.";
    }, {
        readonly key: "approveInvoice";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
