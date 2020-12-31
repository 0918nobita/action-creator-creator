import * as fs from 'fs';
import * as ts from 'typescript';

const program = ts.createProgram(['example/actions.ts'], {});
const source = program.getSourceFile('example/actions.ts')!;
const typeChecker = program.getTypeChecker();

interface ActionTypeDefinition {
  name: string;
}

const tryGetActionTypeDef = (node: ts.InterfaceDeclaration): ActionTypeDefinition | null => {
  const name = node.name.getText();
  const res = name.match(/(.*)Action$/);

  if (res && res.length !== 0) {
    node.members.forEach((member) => {
      const t = typeChecker.getTypeAtLocation(member);

      if (member.name && ts.isIdentifier(member.name)) {
        console.log(member.name.getText());
        console.log(typeChecker.typeToString(t));
      }
    });

    return { name: res[1]! };
  }

  return null;
};

ts.forEachChild(source, (node) => {
  if (ts.isInterfaceDeclaration(node)) {
    const actionTypeDef = tryGetActionTypeDef(node);
    console.log(actionTypeDef);
  }
});

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
