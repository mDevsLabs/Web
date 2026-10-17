export declare const config: {
    readonly name: "Flight";
    readonly label: "Vols";
    readonly description: "Gérez vos vols depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "number";
        readonly label: "Numéro";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "origin";
        readonly label: "Départ";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "destination";
        readonly label: "Arrivée";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "departsOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["scheduled", "boarding", "departed", "delayed"];
    }];
    readonly titleKey: "number";
    readonly settings: readonly [{
        readonly key: "notifyFlight";
        readonly label: "Notifications : vols";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveFlight";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section vols.";
    }, {
        readonly key: "approveFlight";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
