import * as fs from 'fs';
import * as ts from 'typescript';

const program = ts.createProgram(['example/actions.ts'], {});
const source = program.getSourceFile('example/actions.ts')!;
const typeChecker = program.getTypeChecker();

interface ActionTypeDefinition {
  name: string;
  type: string;
  payload: ts.Type | null;
}

const tryGetActionTypeDef = (node: ts.InterfaceDeclaration): ActionTypeDefinition | null => {
  const name = node.name.getText();
  const res = name.match(/(.*)Action$/);

  let type: string | null = null;
  let payload: ts.Type | null = null;

  if (!res || res.length === 0) return null;

  for (const member of node.members) {
    const t = typeChecker.getTypeAtLocation(member);

    if (!member.name) continue;
    if (!ts.isIdentifier(member.name)) continue;
    const text = member.name.getText();

    if (text === 'type' && t.isStringLiteral()) {
      type = t.value;
      continue;
    }

    if (text === 'payload') {
      payload = t;
    }
  }

  if (!type) return null;
  return { name: res[1]!, type, payload };
};

const actionTypeDefs: ActionTypeDefinition[] = []

ts.forEachChild(source, (node) => {
  if (ts.isInterfaceDeclaration(node)) {
    const actionTypeDef = tryGetActionTypeDef(node);
    if (actionTypeDef) actionTypeDefs.push(actionTypeDef);
  }
});

const funcDecls: ts.FunctionDeclaration[] = [];

for (const actionTypeDef of actionTypeDefs) {
  const exprStmt = ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('console'),
        'log'
      ),
      /* typeArguments */ [],
      /* arguments */ [
        ts.factory.createStringLiteral(
          'Hello, world!',
          /* isSingleQuote */ true
        ),
      ]
    ));

  const toLowerCamelCase = (str: string): string => str.charAt(0).toLowerCase() + str.slice(1);

  const funcDecl = ts.factory.createFunctionDeclaration(
    /* decorators */ undefined,
    /* modifiers */ [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    /* asteriskToken */ undefined,
    /* name */ toLowerCamelCase(actionTypeDef.name),
    /* typeParameters */ undefined,
    /* parameters */ [],
    /* returnType */ ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
    ts.factory.createBlock([exprStmt], /* multiline */ true)
  );

  funcDecls.push(funcDecl);
}

const outFile = ts.createSourceFile(
   'out.ts',
   /* sourceText */ '',
  ts.ScriptTarget.Latest,
  /* setParentNodes */ false,
  ts.ScriptKind.TS
);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const nodeArray = ts.factory.createNodeArray(funcDecls);
const result = printer.printList(ts.ListFormat.MultiLine, nodeArray, outFile);
fs.writeFileSync('out.ts', result);
