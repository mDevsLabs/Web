export declare const config: {
    readonly name: "Certificate";
    readonly label: "Certificats";
    readonly description: "Gérez vos certificats depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "recipient";
        readonly label: "Bénéficiaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "issuedOn";
        readonly label: "Délivrance";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["issued", "revoked", "expired"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyCertificate";
        readonly label: "Notifications : certificats";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCertificate";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section certificats.";
    }, {
        readonly key: "approveCertificate";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
