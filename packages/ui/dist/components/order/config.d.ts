export declare const config: {
    readonly name: "Order";
    readonly label: "Commandes";
    readonly description: "Gérez vos commandes depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "customer";
        readonly label: "Client";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "total";
        readonly label: "Total";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "placedOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["pending", "confirmed", "shipped", "delivered"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyOrder";
        readonly label: "Notifications : commandes";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveOrder";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section commandes.";
    }, {
        readonly key: "approveOrder";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
