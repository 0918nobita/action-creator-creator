import * as ts from 'typescript';

const program = ts.createProgram(['example/actions.ts'], {});

const source = program.getSourceFile('example/actions.ts')!;

const typeChecker = program.getTypeChecker();

ts.forEachChild(source, (node) => {
  if (ts.isInterfaceDeclaration(node)) {
    const { name } = node;
    console.log(name.escapedText);
    node.members.forEach((member) => {
      const t = typeChecker.getTypeAtLocation(member);
      if (member.name && ts.isIdentifier(member.name)) {
        console.log(`  ${member.name.getText()}: ${typeChecker.typeToString(t)}`);
      }
    });
  }
});
