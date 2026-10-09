export declare const config: {
    readonly name: "Cart";
    readonly label: "Paniers";
    readonly description: "Gérez vos paniers depuis une interface claire.";
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
        readonly key: "itemCount";
        readonly label: "Articles";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "subtotal";
        readonly label: "Sous-total";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["open", "abandoned", "converted"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyCart";
        readonly label: "Notifications : paniers";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCart";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section paniers.";
    }, {
        readonly key: "approveCart";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
