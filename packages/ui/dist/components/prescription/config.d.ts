export declare const config: {
    readonly name: "Prescription";
    readonly label: "Ordonnances";
    readonly description: "Gérez vos ordonnances depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "prescriber";
        readonly label: "Prescripteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "issuedOn";
        readonly label: "Délivrance";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "validUntil";
        readonly label: "Validité";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "expired", "archived"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyPrescription";
        readonly label: "Notifications : ordonnances";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archivePrescription";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section ordonnances.";
    }, {
        readonly key: "approvePrescription";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
