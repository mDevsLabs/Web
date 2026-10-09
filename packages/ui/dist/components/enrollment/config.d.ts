export declare const config: {
    readonly name: "Enrollment";
    readonly label: "Inscriptions";
    readonly description: "Gérez vos inscriptions depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "student";
        readonly label: "Apprenant";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "course";
        readonly label: "Formation";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "progress";
        readonly label: "Avancement (%)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["active", "completed", "cancelled"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyEnrollment";
        readonly label: "Notifications : inscriptions";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveEnrollment";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section inscriptions.";
    }, {
        readonly key: "approveEnrollment";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
