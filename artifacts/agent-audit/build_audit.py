from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import textwrap

root = Path(r'C:\Users\maria\Desktop\MATHIAS\Dossiers Mathias\mCompany\mAI Web\artifacts\agent-audit')
root.mkdir(parents=True, exist_ok=True)
doc_path = root / 'audit-agent-recommandations.docx'
html_path = root / 'priorites-agent.html'
png_path = root / 'priorites-agent.png'

# Create a compact visual roadmap (also embedded in the DOCX).
W,H=1500,650
im=Image.new('RGB',(W,H),'#F7F9FC'); d=ImageDraw.Draw(im)
font_path='C:/Windows/Fonts/arial.ttf'
def font(sz,bold=False):
 p='C:/Windows/Fonts/arialbd.ttf' if bold else font_path
 try:return ImageFont.truetype(p,sz)
 except:return ImageFont.load_default()
d.text((56,38),'PARCOURS DE REMÉDIATION AGENT',font=font(31,True),fill='#14243A')
d.text((56,82),'Ordre conseillé pour rendre les exécutions fiables, prévisibles et pilotables',font=font(18),fill='#4B5B70')
cols=[(55,150,470,510,'01  P0 · FIABILITÉ','Corriger maintenant',['Aligner le modèle planifié','retenu et ses capacités','Verrouiller atomiquement','la création/reprise du run'],'#B42318'),(535,150,950,510,'02  P1 · GARDE-FOUS','Durcir le parcours',['Valider les types de fichiers','contre les capacités du modèle','Borner chaque tick cron','et traiter les expirations'],'#B54708'),(1015,150,1445,510,'03  P2 · ÉVOLUTION','Améliorer ensuite',['Observabilité des checkpoints','et des décisions de scheduler','Reprise manuelle guidée','et historique des versions','Eval qualité / coût / succès'],'#175CD3')]
for x1,y1,x2,y2,title,subtitle,items,color in cols:
 d.rounded_rectangle((x1,y1,x2,y2),radius=18,fill='white',outline='#D8E0EA',width=2)
 d.rounded_rectangle((x1+22,y1+22,x2-22,y1+82),radius=10,fill=color)
 d.text((x1+38,y1+39),title,font=font(18,True),fill='white')
 d.text((x1+28,y1+105),subtitle,font=font(23,True),fill='#14243A')
 yy=y1+164
 for item in items:
  d.ellipse((x1+30,yy+7,x1+41,yy+18),fill=color)
  for line in textwrap.wrap(item,width=35):
   d.text((x1+55,yy),line,font=font(17),fill='#344054'); yy+=25
  yy+=18
d.text((56,570),'P0 = correction prioritaire   ·   P1 = avant élargissement Alpha   ·   P2 = feuille de route',font=font(16),fill='#4B5B70')
im.save(png_path)

# Author a responsive, self-contained view for in-conversation visualization.
html='''<div id="agent-roadmap" role="img" aria-label="Priorisation des recommandations Agent en trois étapes : fiabilité, garde-fous, évolutions" style="font-family:Arial,sans-serif;color:#14243a;max-width:100%;padding:20px 4px"><h2 style="font-size:20px;margin:0 0 6px">Parcours de remédiation Agent</h2><p style="margin:0 0 18px;color:#526174">Ordre conseillé pour fiabiliser les exécutions puis élargir les capacités.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px"><section style="border-top:5px solid #b42318;padding:12px 4px"><h3>P0 · Fiabilité</h3><p>Corriger maintenant</p><ul><li>Aligner modèle planifié et capacités réellement résolues</li><li>Verrouiller atomiquement la création/reprise d’un run</li></ul></section><section style="border-top:5px solid #b54708;padding:12px 4px"><h3>P1 · Garde-fous</h3><p>Durcir le parcours</p><ul><li>Valider les types de fichiers selon les capacités modèle</li><li>Borner les ticks cron et gérer les leases expirées</li></ul></section><section style="border-top:5px solid #175cd3;padding:12px 4px"><h3>P2 · Évolution</h3><p>Améliorer ensuite</p><ul><li>Observabilité des checkpoints et du scheduler</li><li>Reprise manuelle guidée, historique des versions</li><li>Évaluation qualité, coûts et taux de succès</li></ul></section></div><p style="font-size:13px;color:#526174">P0 priorité immédiate · P1 avant élargissement Alpha · P2 feuille de route</p></div>'''
html_path.write_text(html,encoding='utf-8')

doc=Document()
sec=doc.sections[0]; sec.top_margin=Inches(.65); sec.bottom_margin=Inches(.62); sec.left_margin=Inches(.72); sec.right_margin=Inches(.72)
styles=doc.styles
styles['Normal'].font.name='Arial'; styles['Normal'].font.size=Pt(9.5); styles['Normal'].font.color.rgb=RGBColor(35,48,66)
styles['Normal'].paragraph_format.space_after=Pt(4)
for name,size in [('Title',28),('Heading 1',17),('Heading 2',12)]:
 st=styles[name]; st.font.name='Arial'; st.font.size=Pt(size); st.font.bold=name!='Title'; st.font.color.rgb=RGBColor(20,36,58)
 st.paragraph_format.space_before=Pt(10); st.paragraph_format.space_after=Pt(5)

def shade(cell,fill):
 tcPr=cell._tc.get_or_add_tcPr(); shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),fill); tcPr.append(shd)
def set_cell(cell,text,bold=False,color=None,size=8.5):
 cell.text=''; p=cell.paragraphs[0]; p.paragraph_format.space_after=Pt(1); r=p.add_run(text); r.bold=bold; r.font.name='Arial'; r.font.size=Pt(size)
 if color:r.font.color.rgb=RGBColor(*color)
 cell.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER

def bullet(text):
 p=doc.add_paragraph(style='List Bullet'); p.paragraph_format.space_after=Pt(2); p.add_run(text); return p

def issue(title,priority,evidence,impact,action,acceptance,confidence='Élevée'):
 doc.add_heading(title,2)
 p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(2); r=p.add_run(f'{priority}  ·  Confiance {confidence}'); r.bold=True; r.font.color.rgb=RGBColor(180,35,24) if priority=='P0' else RGBColor(181,71,8)
 for label,txt in [('Preuve',evidence),('Impact',impact),('Correction',action),('Critère d’acceptation',acceptance)]:
  p=doc.add_paragraph(); p.paragraph_format.space_after=Pt(2); r=p.add_run(label+' — '); r.bold=True; p.add_run(txt)

p=doc.add_paragraph(style='Title'); p.add_run('Audit Agent et feuille de route')
p=doc.add_paragraph(); r=p.add_run('Analyse du dépôt côté Agent · synthèse destinée à une IA d’implémentation'); r.bold=True; r.font.size=Pt(12); r.font.color.rgb=RGBColor(71,84,103)
p=doc.add_paragraph('Périmètre : runtime, outils, API, planification, persistance et interface associée. Sources limitées au dépôt et aux tests locaux. Revue statique au 23 septembre 2026 ; aucune modification du code ni exécution de tests.')
# executive callout table
t=doc.add_table(rows=1,cols=1); t.alignment=WD_TABLE_ALIGNMENT.CENTER; c=t.cell(0,0); shade(c,'EAF2FF'); set_cell(c,'Conclusion — la base Agent possède déjà des protections solides (approbations persistées, contrôle d’accès côté serveur, budget cumulé, fetch SSRF défensif). Trois écarts méritent toutefois une correction prioritaire : capacités incohérentes en exécution planifiée lors d’un fallback modèle, absence apparente d’un claim atomique du run interactif, et validation média trop large dans la route.',True,(20,36,58),10)
doc.add_heading('Décision proposée',1)
bullet('P0 : corriger le fallback de modèle planifié et empêcher deux POST concurrents de créer deux runs actifs pour un même chat.')
bullet('P1 : brancher la validation MIME/capacités existante dans la route et rendre explicite le timeout du tick de scheduler.')
bullet('P2 : compléter l’observabilité, le parcours de reprise et l’évaluation continue avant ouverture plus large de l’Alpha.')
doc.add_picture(str(png_path),width=Inches(6.9)); cap=doc.add_paragraph('Figure 1. Séquence de mise en œuvre proposée.'); cap.alignment=WD_ALIGN_PARAGRAPH.CENTER; cap.runs[0].italic=True

doc.add_heading('Constats à corriger',1)
issue('1. Le fallback planifié conserve les capacités du modèle demandé','P0','Dans lib/agent/scheduler/execute.ts, le modèle demandé est chargé en modelEntry puis resolvedModelId peut être remplacé. La sélection des outils et le contexte utilisent encore modelEntry.capabilities (lignes 211–259 et 290–296 dans cette zone).','Un modèle demandé sans outils peut provoquer une sélection incohérente après fallback : capacités de contexte erronées, et filtrage des outils fondé sur le mauvais modèle. La tâche planifiée peut échouer ou s’exécuter avec un contexte inadapté.','Après résolution, charger resolvedEntry = getModelEntry(resolvedModelId, FALLBACK_MODELS), puis utiliser resolvedEntry partout : sélection, contexte, limites médias et création du run.','Un test de contrat force un modèle sans outils puis vérifie que le modèle de repli et ses capacités gouvernent la sélection et le contexte.')
issue('2. La création d’un run interactif n’est pas atomique','P0','app/(chat)/api/agent/route.ts recherche un run actif puis appelle createAgentRun dans un chemin séparé (zone lignes 217–365). getActiveAgentRunByChatId effectue un SELECT ; le schéma AgentRun ne déclare que des index ordinaires sur chatId et statut (lib/db/agent-queries.ts:105–125 ; lib/db/schema.ts:1151–1158).','Deux requêtes concurrentes sur le même chat peuvent toutes deux voir l’absence de run actif et créer chacune un AgentRun. L’interface et la persistance peuvent alors diverger et les actions/outils être exécutés en double. Le chemin planifié possède un mécanisme de lease, mais le chemin interactif ne montre pas de claim équivalent.','Introduire une réservation atomique par chat (transaction/verrou ou table de claim avec contrainte unique), rendre create-or-resume idempotent et renvoyer le run déjà réclamé à la requête perdante.','Un test concurrent lance deux créations simultanées et observe un seul run actif et une seule exécution d’outil.')
issue('3. Les types de fichiers ne sont pas validés contre les capacités détaillées','P1','La route valide uniquement une capacité globale et le nombre de fichiers (app/(chat)/api/agent/route.ts:183–201). validateAttachmentsAgainstModel existe dans lib/agent/context/files.ts:46–88, mais rg n’a relevé aucun appelant. Le schéma accepte des préfixes image/* et text/* (app/(chat)/api/agent/schema.ts:15–40).','Un média accepté à l’entrée peut ne pas être pris en charge par le modèle (images/documents), ou être rejeté seulement plus tard lors de la lecture. L’utilisateur obtient alors une erreur tardive et le run dépense des tokens/outils inutilement.','Appeler validateAttachmentsAgainstModel immédiatement après la résolution effective du modèle ; resserrer si besoin les MIME déclarés et vérifier le type/contenu téléchargé avant extraction.','Tests API couvrant un modèle sans vision avec image, sans documents avec PDF, type non pris en charge et média valide ; refus explicite avant création du run.')
issue('4. Le timeout déclaré du scheduler n’est jamais appliqué','P1','lib/agent/scheduler/engine.ts:266–270 déclare TICK_RUN_TIMEOUT_MS, mais aucune référence à cette constante n’existe ailleurs dans le fichier. La boucle runSchedulerTick traite les schedules séquentiellement (lignes 287–302). Le commentaire promet un tick borné, mais aucun AbortSignal/Promise.race ne borne processDueSchedule ici.','Un appel fournisseur ou un run bloqué peut retenir un worker au-delà de la durée prévue ; avec plusieurs échéances séquentielles, le retard se propage aux tâches suivantes. La lease et les reprises réduisent les doublons, mais ne remplacent pas une limite d’exécution du worker.','Appliquer une deadline réelle au tick/run, propager l’annulation jusque dans le runtime et conserver le checkpoint lors de l’expiration. Définir aussi le comportement des schedules en attente de résolution, distinct d’un timeout d’exécution.','Test avec exécution simulée non résolue : le tick termine avant sa deadline, enregistre l’état attendu et la prochaine exécution reprend le même run sans doublon.')

doc.add_heading('Améliorations recommandées',1)
for h,body in [
('Observabilité exploitable','Remplacer les catch silencieux des points critiques par des événements structurés sans secrets : checkpoint non persisté, compteur non mis à jour, échec de lease, reprise et décision de timeout. Ajouter des métriques sur durée active, tentatives, attente d’approbation et âge des occurrences.'),
('Reprise explicable','Dans la timeline, afficher le motif de suspension, les éléments repris et la limite restante ; proposer une action « reprendre » après timeout, en réutilisant l’identité de run et son checkpoint.'),
('Contrats de capacités partagés','Centraliser la résolution modèle→capacités pour les chemins interactif et planifié afin d’éviter que le modèle demandé et le modèle effectif divergent. Ajouter des tests de parité aux tests unitaires de sélection.'),
('Évaluations de bout en bout','Créer un petit jeu de scénarios déterministes : recherche web avec sources, lecture de fichier, approbation accordée/refusée, réponse à une question, interruption, reprise, budget épuisé et scheduler en échec. Mesurer réussite, durée et coût sans dépendre d’un seul fournisseur.')]:
 doc.add_heading(h,2); doc.add_paragraph(body)

doc.add_heading('Nouvelles fonctionnalités à planifier',1)
t=doc.add_table(rows=1,cols=3); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.style='Table Grid'
for i,v in enumerate(['Fonctionnalité','Valeur utilisateur','Prérequis / garde-fou']): shade(t.rows[0].cells[i],'17365D'); set_cell(t.rows[0].cells[i],v,True,(255,255,255),8.5)
rows=[('Mode prévisualisation des actions','Voir les outils, paramètres et effets prévus avant lancement.','S’appuyer sur le snapshot de permissions et les empreintes d’approbation.'),('Reprise avec choix guidé','Reprendre une tâche interrompue, réduire son périmètre ou modifier ses consignes.','Verrou de run atomique, checkpoint fiable et budget restant visible.'),('Historique/versioning des tâches planifiées','Comparer consigne, modèle, outils et résultats entre occurrences.','Journal de changements versionné et politique de rétention.'),('Évaluation qualité et coût par tâche','Comparer modèles/réglages sur critères de réussite définis.','Télémétrie minimisée, opt-in et coût calculé avec unités explicites.')]
for row in rows:
 cells=t.add_row().cells
 for i,v in enumerate(row): set_cell(cells[i],v,size=8)

doc.add_heading('Plan d’implémentation pour l’IA',1)
for step in ['1. Cartographier les tests et les contrats existants ; ne pas modifier les règles d’approbation persistées.','2. Corriger le chemin scheduler pour utiliser la fiche du modèle résolu, puis ajouter le test de fallback.','3. Ajouter le claim interactif atomique ; migrer les index/contraintes avec une migration réversible et traiter d’abord les éventuels runs actifs historiques.','4. Brancher la validation média par capacités et couvrir les MIME limites.','5. Appliquer une deadline effective au scheduler et préciser la reprise en attente d’approbation/réponse.','6. Ajouter observabilité et critères d’acceptation, puis exécuter les tests ciblés et la suite existante.']:
 bullet(step)

doc.add_heading('Points déjà bien couverts',1)
for s in ['Approbations liées au toolCallId et invalidées si les paramètres présentés changent : lib/agent/approvals/incoming.ts et tests/unit/agent-approvals.test.ts.','Limites techniques et limites produit séparées, avec compteurs cumulatifs de reprises : lib/agent/budget.ts, lib/agent/limits.ts et tests/unit/agent-budget.test.ts.','Téléchargements externes bornés, redirections revalidées et destinations DNS épinglées : lib/web/safe-fetch.ts et lib/agent/tools/internal/extract.ts.','Planification avec fuseau IANA, occurrence réservée par lease et conversation dédiée au schedule : lib/agent/scheduler/engine.ts et lib/agent/scheduler/execute.ts.']:
 bullet(s)

doc.add_heading('Limites de cette revue',1)
doc.add_paragraph('Audit statique ciblé, sans exécution de tests, sans accès à un environnement de production et sans validation des comportements des fournisseurs. Le défaut de résolution des capacités planifiées et l’absence d’appel de la validation média sont directement étayés par le code. Le risque de doublons interactifs doit être confirmé par un test concurrent et par l’analyse du niveau d’isolation PostgreSQL utilisé en production. Le timeout du scheduler est classé comme défaut manifeste d’application du contrat/commentaire, son impact exact dépend du runtime de déploiement et des délais du fournisseur.')
# Footer page number field
for s in doc.sections:
 p=s.footer.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; r=p.add_run('Audit Agent · mAI Web · '); r.font.size=Pt(8); r.font.color.rgb=RGBColor(100,110,125)
 fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); p._p.append(fld)
doc.save(doc_path)
print(doc_path)
print(html_path)
