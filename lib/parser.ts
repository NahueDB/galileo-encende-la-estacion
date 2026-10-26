import { parse } from 'acorn';
import type { Level } from './types';
const allowed = new Set([
  'Program',
  'VariableDeclaration',
  'VariableDeclarator',
  'Identifier',
  'Literal',
  'ExpressionStatement',
  'CallExpression',
  'MemberExpression',
  'AssignmentExpression',
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
  'BlockStatement',
  'IfStatement',
  'BinaryExpression',
  'LogicalExpression',
  'UnaryExpression',
  'ReturnStatement',
  'TemplateLiteral',
  'TemplateElement',
  'EmptyStatement',
]);
const properties = new Set([
  'querySelector',
  'getElementById',
  'textContent',
  'value',
  'addEventListener',
  'trim',
  'log',
]);
export function parseCode(code: string, level?: Level) {
  if (code.length > 12000) throw new Error('El código supera el límite de 12.000 caracteres.');
  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(code, { ecmaVersion: 2022 });
  } catch (error) {
    const position = (error as { loc?: { line: number; column: number } }).loc;
    throw new Error(
      `Revisá la sintaxis${position ? ` en la línea ${position.line}, columna ${position.column + 1}` : ''}: comprobá comillas, paréntesis, llaves y signos de asignación.`,
    );
  }
  const used = new Set<string>();
  let count = 0;
  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (typeof n.type === 'string') {
      if (++count > 1500 || !allowed.has(n.type))
        throw new Error(
          'Esta campaña admite variables, funciones, condicionales y DOM. No admite bucles, objetos, red, importaciones ni otras APIs.',
        );
      if (n.type === 'MemberExpression') {
        const prop = n.property as { name?: string };
        if (n.computed || !prop.name || !properties.has(prop.name))
          throw new Error(
            'Usá propiedades directas de DOM: textContent, value y los métodos de la actividad.',
          );
        used.add(prop.name);
      }
      if (n.type === 'Literal' && (n.regex || typeof n.value === 'bigint'))
        throw new Error('No se necesitan expresiones regulares ni BigInt en esta campaña.');
      if (n.type === 'AssignmentExpression' && n.operator !== '=')
        throw new Error('Usá asignaciones con =.');
      if (n.type === 'UnaryExpression' && !['!', '-', '+', 'typeof'].includes(n.operator as string))
        throw new Error('Operación no disponible en esta campaña.');
    }
    Object.values(n).forEach((v) =>
      Array.isArray(v) ? v.forEach(walk) : typeof v === 'object' && walk(v),
    );
  }
  walk(ast);
  if (level)
    for (const api of level.required)
      if (!used.has(api))
        throw new Error('Este objetivo necesita que practiques ' + api + '. Revisá la consigna.');
  return ast;
}
