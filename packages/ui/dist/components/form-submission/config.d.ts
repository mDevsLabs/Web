export declare const config: {
    readonly name: "FormSubmission";
    readonly label: "Soumissions de formulaire";
    readonly description: "Gérez vos soumissions de formulaire depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "reference";
        readonly label: "Référence";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "formName";
        readonly label: "Formulaire";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "submittedBy";
        readonly label: "Auteur";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "submittedAt";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "fieldCount";
        readonly label: "Nombre de champs";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["received", "reviewing", "accepted", "rejected"];
    }];
    readonly titleKey: "reference";
    readonly settings: readonly [{
        readonly key: "notifyFormSubmission";
        readonly label: "Notifications : soumissions de formulaire";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveFormSubmission";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section soumissions de formulaire.";
    }, {
        readonly key: "approveFormSubmission";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
