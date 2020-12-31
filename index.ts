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

  node.members.forEach((member) => {
    const t = typeChecker.getTypeAtLocation(member);

    if (!member.name) return;
    if (!ts.isIdentifier(member.name)) return;
    const text = member.name.getText();

    if (text === 'type' && t.isStringLiteral()) {
      type = t.value;
      return;
    }

    if (text === 'payload') {
      payload = t;
    }
  });

  return type && { name: res[1]!, type, payload };
};

const actionTypeDefs: ActionTypeDefinition[] = []

ts.forEachChild(source, (node) => {
  if (ts.isInterfaceDeclaration(node)) {
    const actionTypeDef = tryGetActionTypeDef(node);
    if (actionTypeDef) actionTypeDefs.push(actionTypeDef);
  }
});

console.log({ actionTypeDefs });

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

const funcDecl = ts.factory.createFunctionDeclaration(
  /* decorators */ undefined,
  /* modifiers */ [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
  /* asteriskToken */ undefined,
  /* name */ 'example',
  /* typeParameters */ undefined,
  /* parameters */ [],
  /* returnType */ ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
  ts.factory.createBlock([exprStmt], /* multiline */ true)
);

const outFile = ts.createSourceFile(
  'out.ts',
  /* sourceText */ '',
  ts.ScriptTarget.Latest,
  /* setParentNodes */ false,
  ts.ScriptKind.TS
);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const result = printer.printNode(ts.EmitHint.Unspecified, funcDecl, outFile);
fs.writeFileSync('out.ts', result + '\n');
