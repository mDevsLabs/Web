export declare const config: {
    readonly name: "PurchaseOrder";
    readonly label: "Commandes fournisseurs";
    readonly description: "Gérez vos commandes fournisseurs depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "supplier";
        readonly label: "Fournisseur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "amount";
        readonly label: "Montant";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "expectedOn";
        readonly label: "Réception";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "approved", "ordered", "received"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyPurchaseOrder";
        readonly label: "Notifications : commandes fournisseurs";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archivePurchaseOrder";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section commandes fournisseurs.";
    }, {
        readonly key: "approvePurchaseOrder";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
