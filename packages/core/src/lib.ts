import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

interface ActionTypeDefinition {
  name: string;
  type: string;
  hasPayload: boolean;
}

/**
 * interface 宣言をもとに ActionTypeDef を取得する。
 * Action を宣言していない interface 宣言に対して呼び出せば null が返る。
 */
const tryGetActionTypeDef =
  (typeChecker: ts.TypeChecker, node: ts.InterfaceDeclaration): ActionTypeDefinition | null => {
    const name = node.name.getText();
    const res = name.match(/(.*)Action$/);

    let type: string | null = null;
    let hasPayload = false;

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
        hasPayload = true;
      }
    }

    if (!type) return null;
    return { name: res[1]!, type, hasPayload };
  };

export const bootstrap = (files: string[]): void => {
  for (const file of files) {
    const program = ts.createProgram([file], {});
    const source = program.getSourceFile(file)!;
    const typeChecker = program.getTypeChecker();

    const actionTypeDefs: ActionTypeDefinition[] = []

    ts.forEachChild(source, (node) => {
      if (ts.isInterfaceDeclaration(node)) {
        const actionTypeDef = tryGetActionTypeDef(typeChecker, node);
        if (actionTypeDef) actionTypeDefs.push(actionTypeDef);
      }
    });

    const importElements: ts.ImportSpecifier[] = [];
    const funcDecls: ts.FunctionDeclaration[] = [];

    for (const actionTypeDef of actionTypeDefs) {
      const actionTypeIdent = ts.factory.createIdentifier(`${actionTypeDef.name}Action`);

      importElements.push(ts.factory.createImportSpecifier(
        /* propertyName */ undefined,
        /* name */ actionTypeIdent
      ));

      const properties: ts.ObjectLiteralElementLike[] = [
        ts.factory.createPropertyAssignment(
          ts.factory.createIdentifier('type'),
          ts.factory.createStringLiteral(actionTypeDef.type)
        ),
      ];
      if (actionTypeDef.hasPayload) {
        properties.push(
          ts.factory.createShorthandPropertyAssignment(
            ts.factory.createIdentifier('payload')
          )
        );
      }
      const retStmt = ts.factory.createReturnStatement(
        ts.factory.createObjectLiteralExpression(properties)
      );

      const toLowerCamelCase = (str: string): string => str.charAt(0).toLowerCase() + str.slice(1);

      const funcDecl = ts.factory.createFunctionDeclaration(
        /* decorators */ undefined,
        /* modifiers */ [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        /* asteriskToken */ undefined,
        /* name */ toLowerCamelCase(actionTypeDef.name),
        /* typeParameters */ undefined,
        /* parameters */
          actionTypeDef.hasPayload ?
            [
              ts.factory.createParameterDeclaration(
                /* decorators */ undefined,
                /* modifiers */ undefined,
                /* dotDotDotToken */ undefined,
                ts.factory.createIdentifier('payload'),
                /* questionToken */ undefined,
                ts.factory.createIndexedAccessTypeNode(
                  ts.factory.createTypeReferenceNode(actionTypeIdent),
                  ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('payload'))
                )
              ),
            ]
            : [],
        /* returnType */ ts.factory.createTypeReferenceNode(actionTypeIdent),
        ts.factory.createBlock([retStmt], /* multiline */ true)
      );

      funcDecls.push(funcDecl);
    }

    const dirname = path.dirname(file);
    const basename = path.basename(file, '.ts');

    const importDecl = ts.factory.createImportDeclaration(
      /* decorators */ undefined,
      /* modifiers */ undefined,
      ts.factory.createImportClause(
        /* isTypeOnly */ true,
        /* name */ undefined,
        /* namedBindings */ ts.factory.createNamedImports(importElements)
      ),
      ts.factory.createStringLiteral(`./${basename}`)
    );

    const nodeArray = ts.factory.createNodeArray([importDecl, ...funcDecls]);

    const outFile = ts.createSourceFile(
      'out.ts',
      /* sourceText */ '',
      ts.ScriptTarget.Latest,
      /* setParentNodes */ false,
      ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const result = printer.printList(ts.ListFormat.MultiLine, nodeArray, outFile);

    fs.writeFileSync(`${dirname}${path.sep}${basename}.creators.ts`, result);
  }
};
