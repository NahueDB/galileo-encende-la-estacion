// @ts-nocheck
// Capability interpreter: never evaluates source as JavaScript. Kept self-contained for srcdoc.
export function createRuntime(doc) {
  let fuel = 0;
  let depth = 0;
  let listenerCount = 0;
  let root;
  const logs = [];
  const documentCapability = Object.freeze({ kind: 'document' });
  const consoleCapability = Object.freeze({ kind: 'console' });
  function tick() {
    if (--fuel < 0)
      throw new Error(
        'Se alcanzó el límite de operaciones. Revisá si una función se llama a sí misma.',
      );
  }
  function scope(parent) {
    return { vars: new Map(), parent };
  }
  function lookup(env, name) {
    for (let e = env; e; e = e.parent) if (e.vars.has(name)) return e.vars.get(name);
    throw new Error('No está definido: ' + name);
  }
  function assign(env, name, value) {
    for (let e = env; e; e = e.parent)
      if (e.vars.has(name)) {
        const old = e.vars.get(name);
        if (old.constant) throw new Error('No podés reasignar una constante.');
        e.vars.set(name, { ...old, value });
        return value;
      }
    throw new Error('No está definido: ' + name);
  }
  function isElement(obj) {
    return obj && obj.ownerDocument === doc && obj.nodeType === 1;
  }
  function member(obj, key) {
    if (obj === null || obj === undefined)
      throw new Error(
        'No encontramos el elemento (null). Revisá el selector; un id lleva # en querySelector.',
      );
    if (obj === documentCapability && ['querySelector', 'getElementById'].includes(key))
      return {
        native: (args) => {
          if (typeof args[0] !== 'string' || args[0].length > 200)
            throw new Error('El selector debe ser texto breve.');
          try {
            return doc[key](args[0]);
          } catch {
            throw new Error(
              'El selector CSS no es válido. Revisá las comillas y el símbolo que identifica id o clase.',
            );
          }
        },
      };
    if (obj === consoleCapability && key === 'log')
      return {
        native: (args) => {
          logs.push(
            args
              .map((x) =>
                isElement(x) ? '<' + x.tagName.toLowerCase() + ' id="' + x.id + '">' : String(x),
              )
              .join(' '),
          );
        },
      };
    if (isElement(obj)) {
      if (key === 'textContent' || (key === 'value' && obj.tagName === 'INPUT')) return obj[key];
      if (key === 'addEventListener' && obj.tagName === 'BUTTON')
        return {
          native: (args) => {
            if (++listenerCount > 32)
              throw new Error(
                'Se alcanzó el límite de listeners. Registrá cada acción una sola vez.',
              );
            if (depth > 1)
              throw new Error(
                'Registrá los eventos al iniciar, fuera de las funciones que responden al clic.',
              );
            if (args[0] !== 'click' || !args[1]?.fn)
              throw new Error('Registrá click y una función sin invocarla con paréntesis.');
            const fn = args[1];
            obj.addEventListener('click', () => {
              fuel = 4000;
              depth = 0;
              try {
                invoke(fn, []);
              } catch (e) {
                doc.dispatchEvent(
                  new doc.defaultView.CustomEvent('runner-error', { detail: e.message }),
                );
              }
            });
          },
        };
    }
    if (typeof obj === 'string' && key === 'trim') return { native: () => obj.trim() };
    throw new Error('Esa propiedad no está disponible para este objeto: ' + key);
  }
  function invoke(fn, args) {
    tick();
    if (++depth > 30) throw new Error('Demasiadas llamadas de función.');
    try {
      if (fn?.native) return fn.native(args);
      if (!fn?.fn) throw new Error('Se intentó llamar algo que no es una función.');
      const e = scope(fn.env);
      fn.node.params.forEach((p, i) => {
        if (p.type !== 'Identifier') throw new Error('Usá parámetros simples.');
        e.vars.set(p.name, { value: args[i] });
      });
      const result =
        fn.node.body.type === 'BlockStatement'
          ? run(fn.node.body, e)
          : { returned: true, value: run(fn.node.body, e) };
      return result?.returned ? result.value : undefined;
    } finally {
      depth--;
    }
  }
  function run(n, e) {
    tick();
    if (!n) return;
    switch (n.type) {
      case 'Program':
      case 'BlockStatement': {
        const local = n.type === 'Program' ? e : scope(e);
        for (const s of n.body)
          if (s.type === 'FunctionDeclaration')
            local.vars.set(s.id.name, { value: { fn: true, node: s, env: local }, constant: true });
        for (const s of n.body) {
          const r = run(s, local);
          if (r?.returned) return r;
        }
        return;
      }
      case 'EmptyStatement':
      case 'FunctionDeclaration':
        return;
      case 'VariableDeclaration':
        for (const d of n.declarations) {
          if (d.id.type !== 'Identifier') throw new Error('Usá variables simples.');
          if (e.vars.has(d.id.name)) throw new Error('Variable repetida: ' + d.id.name);
          e.vars.set(d.id.name, {
            value: d.init ? run(d.init, e) : undefined,
            constant: n.kind === 'const',
          });
        }
        return;
      case 'Identifier':
        return lookup(e, n.name).value;
      case 'Literal':
        return n.value;
      case 'ExpressionStatement':
        run(n.expression, e);
        return;
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        return { fn: true, node: n, env: e };
      case 'MemberExpression':
        return member(run(n.object, e), n.property.name);
      case 'CallExpression':
        return invoke(
          run(n.callee, e),
          n.arguments.map((a) => run(a, e)),
        );
      case 'AssignmentExpression': {
        const value = run(n.right, e);
        if (n.left.type === 'Identifier') return assign(e, n.left.name, value);
        if (n.left.type !== 'MemberExpression') throw new Error('Asignación no disponible.');
        const obj = run(n.left.object, e),
          key = n.left.property.name;
        if (
          !isElement(obj) ||
          !['textContent', 'value'].includes(key) ||
          (key === 'value' && obj.tagName !== 'INPUT')
        )
          throw new Error('Solo podés modificar textContent o value en elementos HTML.');
        if (!['string', 'number', 'boolean'].includes(typeof value))
          throw new Error('Asigná texto o valores simples.');
        if (String(value).length > 4000) throw new Error('El texto es demasiado largo.');
        obj[key] = value;
        return value;
      }
      case 'IfStatement':
        return run(run(n.test, e) ? n.consequent : n.alternate, e);
      case 'ReturnStatement':
        return { returned: true, value: n.argument ? run(n.argument, e) : undefined };
      case 'LogicalExpression': {
        const a = run(n.left, e);
        return n.operator === '&&'
          ? a && run(n.right, e)
          : n.operator === '||'
            ? a || run(n.right, e)
            : (a ?? run(n.right, e));
      }
      case 'UnaryExpression': {
        const a = run(n.argument, e);
        if (n.operator === '!') return !a;
        if (n.operator === '-') return -a;
        if (n.operator === '+') return +a;
        return typeof a;
      }
      case 'BinaryExpression': {
        const a = run(n.left, e),
          b = run(n.right, e);
        switch (n.operator) {
          case '+':
            if (typeof a === 'string' || typeof b === 'string') {
              const s = String(a) + String(b);
              if (s.length > 4000) throw new Error('Texto demasiado largo.');
              return s;
            }
            return a + b;
          case '===':
            return a === b;
          case '!==':
            return a !== b;
          case '==':
            return a == b;
          case '!=':
            return a != b;
          case '>':
            return a > b;
          case '<':
            return a < b;
          case '>=':
            return a >= b;
          case '<=':
            return a <= b;
          case '-':
            return a - b;
          case '*':
            return a * b;
          case '/':
            return a / b;
          default:
            throw new Error('Operador no disponible.');
        }
      }
      case 'TemplateLiteral': {
        let s = n.quasis[0].value.cooked;
        n.expressions.forEach((x, i) => {
          s += String(run(x, e)) + n.quasis[i + 1].value.cooked;
        });
        if (s.length > 4000) throw new Error('Texto demasiado largo.');
        return s;
      }
      default:
        throw new Error('Sintaxis no admitida: ' + n.type);
    }
  }
  return {
    execute(ast) {
      fuel = 8000;
      depth = 0;
      listenerCount = 0;
      root = scope(null);
      root.vars.set('document', { value: documentCapability, constant: true });
      root.vars.set('console', { value: consoleCapability, constant: true });
      run(ast, root);
    },
    selected() {
      try {
        return lookup(root, 'estacion').value === doc.getElementById('estacion');
      } catch {
        return false;
      }
    },
    selection() {
      try {
        const value = lookup(root, 'estacion').value;
        return value === null
          ? 'null'
          : value === doc.getElementById('estacion')
            ? 'target'
            : 'other';
      } catch {
        return 'missing';
      }
    },
    logs,
  };
}

export function runnerMain(config, runtimeFactory) {
  const { id, html, ast, level, testing } = config;
  const container = document.getElementById('exercise');
  const runtime = runtimeFactory(document);
  let runtimeError = '';
  document.addEventListener('runner-error', (e) => {
    runtimeError = e.detail;
    send({ kind: 'error', error: runtimeError });
  });
  function send(data) {
    parent.postMessage({ channel: 'galileo', id, ...data }, '*');
  }
  function reset() {
    container.innerHTML = html;
    runtime.execute(ast);
  }
  function text() {
    return (
      (
        document.getElementById('estado') ||
        document.getElementById('mensaje') ||
        document.getElementById('estacion')
      )?.textContent || ''
    );
  }
  function snapshot() {
    const t = text();
    return {
      text: t,
      value: document.getElementById('nombre')?.value || '',
      selected: runtime.selected(),
      running: t === 'Estación en funcionamiento' || t.startsWith('Estación asignada a '),
    };
  }
  function click(id) {
    document.getElementById(id)?.click();
    if (runtimeError) throw new Error(runtimeError);
  }
  function input(v) {
    document.getElementById('nombre').value = v;
  }
  try {
    reset();
    if (testing) {
      const checks = [];
      function check(label, pass, detail) {
        checks.push({ label, pass: !!pass, detail: pass ? undefined : detail });
      }
      if (level === 1) {
        const selection = runtime.selection();
        check(
          'Selecciona un elemento existente',
          selection === 'target' || selection === 'other',
          'No encontramos el elemento. Revisá si el identificador necesita #.',
        );
        check(
          'La referencia corresponde a #estacion',
          selection === 'target',
          selection === 'other'
            ? 'Seleccionaste otro elemento existente. Buscá el párrafo con id estacion.'
            : 'No encontramos la estación correcta. Revisá #estacion.',
        );
      }
      if (level === 2)
        check(
          'Actualiza el aviso',
          text() === 'El taller está disponible para trabajar',
          'Asigná el texto solicitado a estado.textContent.',
        );
      if (level === 3 || level === 4) {
        check(
          'Espera antes del clic',
          text() === 'Estación en espera',
          'La estación cambió antes del clic. Pasá la función sin invocarla.',
        );
        click('activar');
        check(
          'Activar enciende',
          text() === 'Estación en funcionamiento',
          'El clic no produjo el mensaje de funcionamiento.',
        );
        if (level === 4) {
          for (const name of ['detener', 'activar', 'detener']) {
            click(name);
            check(
              'Alternancia: ' + name,
              text() === (name === 'activar' ? 'Estación en funcionamiento' : 'Estación detenida'),
              'Revisá la función asociada a ' + name + '.',
            );
          }
        }
      }
      if (level === 5 || level === 6) {
        check(
          'Mensaje inicial',
          text() === 'No hay una persona registrada',
          'El registro debe esperar al clic.',
        );
        if (level === 6) {
          for (const value of ['', '   ']) {
            input(value);
            click('registrar');
            check(
              value ? 'Solo espacios' : 'Campo vacío',
              text() === 'Ingresá el nombre de la persona responsable',
              value
                ? 'El campo con espacios también debe considerarse vacío.'
                : 'Solicitá el nombre si está vacío.',
            );
          }
          click('limpiar');
          check(
            'Limpieza después de error',
            text() === 'No hay una persona registrada' && snapshot().value === '',
            'Limpiar debe restablecer ambos valores incluso después de un error.',
          );
        }
        for (const name of level === 6 ? ['Ana', '  Bruno  ', 'Celeste'] : ['Ana', 'Bruno']) {
          input(name);
          click('registrar');
          check(
            'Registra ' + name.trim(),
            text() === 'Estación asignada a ' + (level === 6 ? name.trim() : name),
            'Probamos otro nombre y la salida no coincide. Leé value dentro de la función; revisá trim() y el mensaje.',
          );
        }
        if (level === 6) {
          click('limpiar');
          check(
            'Limpia campo y mensaje',
            text() === 'No hay una persona registrada' && snapshot().value === '',
            'Limpiar debe vaciar el campo y restablecer el mensaje inicial.',
          );
        }
      }
      send({ kind: 'result', result: { pass: checks.every((c) => c.pass), checks } });
    } else {
      send({ kind: 'snapshot', snapshot: snapshot() });
      container.addEventListener('click', () => {
        send({ kind: 'snapshot', snapshot: snapshot() });
      });
      const observer = new MutationObserver(() => send({ kind: 'snapshot', snapshot: snapshot() }));
      observer.observe(container, { subtree: true, childList: true, characterData: true });
      send({ kind: 'ready' });
    }
  } catch (e) {
    send({
      kind: testing ? 'result' : 'error',
      error: e.message,
      result: { pass: false, checks: [], error: e.message },
    });
  }
}
