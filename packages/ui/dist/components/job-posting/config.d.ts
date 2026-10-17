export declare const config: {
    readonly name: "JobPosting";
    readonly label: "Offres d’emploi";
    readonly description: "Gérez vos offres d’emploi depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "title";
        readonly label: "Poste";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "department";
        readonly label: "Service";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "location";
        readonly label: "Lieu";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "applicantCount";
        readonly label: "Candidatures";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["draft", "published", "closed"];
    }];
    readonly titleKey: "title";
    readonly settings: readonly [{
        readonly key: "notifyJobPosting";
        readonly label: "Notifications : offres d’emploi";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveJobPosting";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section offres d’emploi.";
    }, {
        readonly key: "approveJobPosting";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
