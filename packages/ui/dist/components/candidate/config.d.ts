export declare const config: {
    readonly name: "Candidate";
    readonly label: "Candidatures";
    readonly description: "Gérez vos candidatures depuis une interface claire.";
    readonly fields: readonly [{
        readonly key: "name";
        readonly label: "Nom";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "email";
        readonly label: "E-mail";
        readonly kind: "email";
        readonly required: true;
    }, {
        readonly key: "position";
        readonly label: "Poste";
        readonly kind: "text";
        readonly required: true;
    }, {
        readonly key: "score";
        readonly label: "Évaluation";
        readonly kind: "number";
        readonly required: true;
    }, {
        readonly key: "status";
        readonly label: "Statut";
        readonly kind: "status";
        readonly required: true;
        readonly options: readonly ["applied", "screening", "interview", "offer", "rejected"];
    }];
    readonly titleKey: "name";
    readonly settings: readonly [{
        readonly key: "notifyCandidate";
        readonly label: "Notifications : candidatures";
        readonly description: "Recevoir un signal lors des changements.";
    }, {
        readonly key: "archiveCandidate";
        readonly label: "Archivage automatique";
        readonly description: "Archiver les éléments terminés de la section candidatures.";
    }, {
        readonly key: "approveCandidate";
        readonly label: "Validation requise";
        readonly description: "Demander une validation avant publication ou activation.";
    }];
};
