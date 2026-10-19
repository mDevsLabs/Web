export declare const config: {
    readonly name: "Exam";
    readonly label: "Examens";
    readonly description: "Gérez vos examens depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Titre";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "course";
        readonly label: "Formation";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "scheduledOn";
        readonly label: "Date";
        readonly kind: "date";
        readonly required: true;
    }, {
        readonly key: "durationMinutes";
        readonly label: "Durée (min)";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["scheduled", "open", "graded"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyExam";
        readonly label: "Notifications : examens";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveExam";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section examens.";
    }, {
        readonly key: "approveExam";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
