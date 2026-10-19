export declare const config: {
    readonly name: "Shipment";
    readonly label: "Expéditions";
    readonly description: "Gérez vos expéditions depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "trackingNumber";
        readonly label: "Suivi";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "carrier";
        readonly label: "Transporteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "destination";
        readonly label: "Destination";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "expectedOn";
        readonly label: "Livraison prévue";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["preparing", "in-transit", "delivered", "delayed"];
    }];
    readonly titleKey: "trackingNumber";
    readonly settings: readonly [{
        readonly key: "notifyShipment";
        readonly label: "Notifications : expéditions";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveShipment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section expéditions.";
    }, {
        readonly key: "approveShipment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
