/** Inventaire reproductible du backend déployé séparément et des routes Next. */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const rel = (file) => relative(root, file).replaceAll("\\", "/");
const methods = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);
const graph = new Map();
const routes = [];

function inspect(file, backend) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true
  );
  const imports = [];
  const handlers = [];
  const registrations = [];
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node)) {
      if (
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        imports.push(node.arguments[0].text);
      if (backend && ts.isPropertyAccessExpression(node.expression)) {
        const receiver = node.expression.expression.getText(source);
        const method = node.expression.name.text;
        if (receiver === "app" && methods.has(method)) {
          const argument = node.arguments[0];
          const literal =
            argument &&
            (ts.isStringLiteral(argument) ||
              ts.isNoSubstitutionTemplateLiteral(argument));
          routes.push({
            dynamic: !literal,
            file: rel(file),
            line:
              source.getLineAndCharacterOfPosition(node.getStart(source)).line +
              1,
            method: method.toUpperCase(),
            path: literal ? argument.text : (argument?.getText(source) ?? ""),
          });
        }
      }
      if (
        backend &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "registerMulti"
      ) {
        const [method, paths] = node.arguments;
        if (
          method &&
          ts.isStringLiteral(method) &&
          methods.has(method.text) &&
          paths &&
          ts.isArrayLiteralExpression(paths)
        ) {
          for (const path of paths.elements) {
            const literal =
              ts.isStringLiteral(path) ||
              ts.isNoSubstitutionTemplateLiteral(path);
            routes.push({
              dynamic: !literal,
              file: rel(file),
              line:
                source.getLineAndCharacterOfPosition(node.getStart(source))
                  .line + 1,
              method: method.text.toUpperCase(),
              path: literal ? path.text : path.getText(source),
            });
          }
        }
      }
      if (
        backend &&
        ts.isIdentifier(node.expression) &&
        /^register.*Routes$/.test(node.expression.text)
      )
        registrations.push(node.expression.text);
    }
    if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      for (const entry of node.exportClause.elements) {
        if (methods.has(entry.name.text.toLowerCase()))
          handlers.push(entry.name.text);
      }
    }
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      methods.has(node.name.text.toLowerCase()) &&
      node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
    )
      handlers.push(node.name.text);
    if (
      ts.isVariableStatement(node) &&
      node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
      )
    ) {
      for (const declaration of node.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          methods.has(declaration.name.text.toLowerCase())
        ) {
          handlers.push(declaration.name.text);
        } else if (ts.isObjectBindingPattern(declaration.name)) {
          for (const entry of declaration.name.elements) {
            if (
              ts.isIdentifier(entry.name) &&
              methods.has(entry.name.text.toLowerCase())
            )
              handlers.push(entry.name.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return {
    handlers: [...new Set(handlers)].sort(),
    imports: [...new Set(imports)].sort(),
    lines: source.getLineAndCharacterOfPosition(source.end).line + 1,
    registrations: [...new Set(registrations)].sort(),
  };
}

function explore(file) {
  if (graph.has(file)) return;
  const item = inspect(file, true);
  graph.set(file, item);
  for (const dependency of item.imports) {
    if (!dependency.startsWith(".")) continue;
    const target = resolve(dirname(file), dependency);
    if (!existsSync(target))
      throw new Error(`Import local absent : ${rel(file)} → ${dependency}`);
    explore(target);
  }
}
explore(resolve(root, "main.ts"));

const next = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === "route.ts" || entry.name === "route.tsx") {
      const item = inspect(file, false);
      const path = `/${rel(file)
        .replace(/^app\//, "")
        .replace(/\/route\.tsx?$/, "")
        .split("/")
        .filter((segment) => !segment.startsWith("("))
        .join("/")}`;
      next.push({
        file: rel(file),
        imports: item.imports,
        methods: item.handlers,
        path,
      });
    }
  }
}
walk(resolve(root, "app"));

const inventory = {
  entrypoint: "main.ts",
  files: [...graph.entries()]
    .map(([file, item]) => ({ file: rel(file), ...item }))
    .sort((a, b) => a.file.localeCompare(b.file)),
  limitations: [
    "Les chemins sont relevés dans les appels app.<méthode> ; les chemins calculés sont signalés.",
    "Cet inventaire statique ne certifie ni les réponses des services externes, ni le déploiement Val Town.",
    "Les imports des routes Next permettent d'identifier BFF et accès directs ; toutes les routes Next ne sont pas des proxys.",
  ],
  nextRoutes: next.sort((a, b) => a.path.localeCompare(b.path)),
  routes: routes.sort(
    (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
  ),
  runtime: "Hono / Val Town (imports Deno)",
};
writeFileSync(
  resolve(root, "docs/1-web/API_INVENTORY.json"),
  `${JSON.stringify(inventory, null, 2)}\n`
);
console.log(
  `${inventory.files.length} modules backend, ${inventory.routes.length} déclarations de routes, ${next.length} routes Next inventoriés.`
);
