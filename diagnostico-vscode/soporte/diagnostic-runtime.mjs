// @ts-nocheck
// Self-contained capability interpreter, serialized into an opaque iframe.
// Student source is never evaluated by the JavaScript engine.
export function createDiagnosticRuntime(doc) {
    let fuel = 0, depth = 0, instances = 0, listeners = 0, root;
    const documentCap = Object.freeze({}), consoleCap = Object.freeze({});
    const logs = [];
    const blocked = new Set([
        '__proto__',
        'prototype',
        'constructor',
        'caller',
        'callee',
        'arguments',
    ]);
    const scope = (parent) => ({ vars: new Map(), parent });
    function tick() {
        if (--fuel < 0)
            throw new Error('Límite de operaciones: revisá la condición del ciclo o la recursión.');
    }
    function binding(env, name) {
        for (let e = env; e; e = e.parent)
            if (e.vars.has(name))
                return e.vars.get(name);
        throw new Error('No está definido: ' + name);
    }
    function context(env) {
        for (let e = env; e; e = e.parent)
            if (e.context)
                return e.context;
        throw new Error('this y super se usan dentro de los métodos de una clase.');
    }
    function self(env) {
        const c = context(env);
        if (!c.initialized)
            throw new Error('Llamá a super(...) antes de usar this.');
        return c.self;
    }
    function simple(value) {
        if (value !== null && !['string', 'number', 'boolean', 'undefined'].includes(typeof value))
            throw new Error('Esta operación necesita un valor simple.');
        if (typeof value === 'string' && value.length > 4000)
            throw new Error('Texto demasiado largo.');
        return value;
    }
    const element = (obj) => obj && obj.ownerDocument === doc && obj.nodeType === 1;
    function findMethod(cls, key, kind) {
        for (let c = cls; c; c = c.parent) {
            const method = c[kind].get(key);
            if (method)
                return { fn: true, node: method, env: c.env, owner: c };
        }
    }
    function privateSlot(obj, key, env) {
        const owner = context(env).owner;
        const values = obj?.kind === 'instance' && obj.privates.get(owner);
        if (!values || !values.has(key))
            throw new Error('El atributo privado no pertenece a esta clase.');
        return values;
    }
    function member(obj, key, env, privateKey = false) {
        tick();
        if (obj === null || obj === undefined)
            throw new Error('No encontramos el elemento o valor. Revisá el selector y los datos.');
        if (privateKey)
            return privateSlot(obj, key, env).get(key);
        if (blocked.has(String(key)))
            throw new Error('Esa propiedad no está disponible.');
        if (obj === documentCap && ['querySelector', 'getElementById'].includes(key))
            return {
                native: (args) => {
                    if (typeof args[0] !== 'string' || args[0].length > 200)
                        throw new Error('Usá un selector de texto breve.');
                    return doc[key](args[0]);
                },
            };
        if (obj === consoleCap && key === 'log')
            return {
                native: (args) => {
                    if (logs.length < 50)
                        logs.push(args
                            .map((v) => (typeof v === 'object' ? '[objeto]' : String(v)))
                            .join(' ')
                            .slice(0, 4000));
                },
            };
        if (element(obj)) {
            if (key === 'textContent' || (key === 'value' && obj.tagName === 'INPUT'))
                return obj[key];
            if (key === 'addEventListener' && obj.tagName === 'BUTTON')
                return {
                    native: (args) => {
                        if (++listeners > 32 || depth > 1)
                            throw new Error('Registrá cada evento una vez, fuera de la función de clic.');
                        if (args[0] !== 'click' || !args[1]?.fn)
                            throw new Error('Registrá click y una función sin invocarla.');
                        obj.addEventListener('click', () => {
                            fuel = 16000;
                            depth = 0;
                            try {
                                invoke(args[1], []);
                            }
                            catch (error) {
                                doc.dispatchEvent(new doc.defaultView.CustomEvent('runner-error', { detail: error.message }));
                            }
                        });
                    },
                };
        }
        if (typeof obj === 'string') {
            if (key === 'length')
                return obj.length;
            if (key === 'trim')
                return { native: () => obj.trim() };
        }
        if (Array.isArray(obj)) {
            if (key === 'length')
                return obj.length;
            if (key === 'push')
                return {
                    native: (args) => {
                        if (obj.length + args.length > 512)
                            throw new Error('La lista supera el límite de 512 elementos.');
                        return obj.push(...args);
                    },
                };
            if (Number.isInteger(key) && key >= 0 && key < 512)
                return obj[key];
        }
        if (obj.kind === 'instance') {
            const getter = findMethod(obj.cls, key, 'getters');
            if (getter)
                return invoke({ ...getter, receiver: obj }, []);
            if (obj.values.has(key))
                return obj.values.get(key);
            const method = findMethod(obj.cls, key, 'methods');
            if (method)
                return { ...method, receiver: obj };
            return undefined;
        }
        throw new Error('Propiedad no disponible para este valor: ' + String(key));
    }
    function setMember(obj, key, value, env, privateKey = false) {
        tick();
        if (privateKey) {
            privateSlot(obj, key, env).set(key, value);
            return value;
        }
        if (blocked.has(String(key)))
            throw new Error('No podés modificar esa propiedad.');
        if (element(obj) && (key === 'textContent' || (key === 'value' && obj.tagName === 'INPUT'))) {
            obj[key] = simple(value);
            return value;
        }
        if (Array.isArray(obj) && Number.isInteger(key) && key >= 0 && key < 512) {
            obj[key] = value;
            return value;
        }
        if (obj?.kind === 'instance') {
            const setter = findMethod(obj.cls, key, 'setters');
            if (setter)
                invoke({ ...setter, receiver: obj }, [value]);
            else {
                if (findMethod(obj.cls, key, 'getters'))
                    throw new Error('Esta propiedad solo tiene getter.');
                if (obj.values.size >= 100 && !obj.values.has(key))
                    throw new Error('Demasiados atributos.');
                obj.values.set(key, value);
            }
            return value;
        }
        throw new Error('No podés modificar esa propiedad de este valor.');
    }
    function ref(node, env) {
        if (node.type === 'Identifier') {
            const b = binding(env, node.name);
            return {
                get: () => b.value,
                set: (value) => {
                    if (b.constant)
                        throw new Error('No podés reasignar una constante.');
                    b.value = value;
                    return value;
                },
            };
        }
        if (node.type !== 'MemberExpression')
            throw new Error('Revisá el destino de la asignación.');
        const obj = run(node.object, env), key = node.computed ? run(node.property, env) : node.property.name;
        const priv = node.property.type === 'PrivateIdentifier';
        return {
            get: () => member(obj, key, env, priv),
            set: (value) => setMember(obj, key, value, env, priv),
        };
    }
    function invoke(fn, args, constructorContext) {
        tick();
        if (++depth > 30) {
            depth--;
            throw new Error('Demasiadas llamadas de función.');
        }
        try {
            if (fn?.native)
                return fn.native(args);
            if (!fn?.fn)
                throw new Error('Se intentó llamar algo que no es una función.');
            const e = scope(fn.env);
            if (constructorContext)
                e.context = constructorContext;
            else if (fn.receiver)
                e.context = { self: fn.receiver, owner: fn.owner, initialized: true };
            fn.node.params.forEach((p, i) => {
                if (p.type !== 'Identifier')
                    throw new Error('Usá parámetros simples.');
                e.vars.set(p.name, { value: args[i] });
            });
            const result = fn.node.body.type === 'BlockStatement'
                ? run(fn.node.body, e)
                : { signal: 'return', value: run(fn.node.body, e) };
            return result?.signal === 'return' ? result.value : undefined;
        }
        finally {
            depth--;
        }
    }
    function initFields(cls, obj) {
        const values = new Map();
        obj.privates.set(cls, values);
        const e = scope(cls.env);
        e.context = { self: obj, owner: cls, initialized: true };
        for (const field of cls.fields) {
            const value = field.value ? run(field.value, e) : undefined;
            (field.key.type === 'PrivateIdentifier' ? values : obj.values).set(field.key.name, value);
        }
    }
    function initialize(cls, obj, args) {
        tick();
        if (cls.ctor) {
            const c = { self: obj, owner: cls, initialized: !cls.parent };
            if (!cls.parent)
                initFields(cls, obj);
            invoke({ fn: true, node: cls.ctor, env: cls.env }, args, c);
            if (!c.initialized)
                throw new Error('Falta llamar a super(...) en el constructor de la subclase.');
        }
        else {
            if (cls.parent)
                initialize(cls.parent, obj, args);
            initFields(cls, obj);
        }
    }
    function construct(cls, args) {
        if (cls?.kind !== 'class')
            throw new Error('new necesita una clase de la actividad.');
        if (++instances > 100)
            throw new Error('Demasiados objetos en una ejecución.');
        const obj = { kind: 'instance', cls, values: new Map(), privates: new Map() };
        initialize(cls, obj, args);
        return obj;
    }
    function binary(op, a, b) {
        switch (op) {
            case '+':
                return simple(simple(a) + simple(b));
            case '-':
                return simple(a) - simple(b);
            case '*':
                return simple(a) * simple(b);
            case '/':
                return simple(a) / simple(b);
            case '%':
                return simple(a) % simple(b);
            case '===':
                return a === b;
            case '!==':
                return a !== b;
            case '==':
                return a == b;
            case '!=':
                return a != b;
            case '>':
                return simple(a) > simple(b);
            case '<':
                return simple(a) < simple(b);
            case '>=':
                return simple(a) >= simple(b);
            case '<=':
                return simple(a) <= simple(b);
            default:
                throw new Error('Operador no disponible: ' + op);
        }
    }
    function run(n, e) {
        tick();
        if (!n)
            return;
        switch (n.type) {
            case 'Program':
            case 'BlockStatement': {
                const local = n.type === 'Program' ? e : scope(e);
                for (const s of n.body)
                    if (s.type === 'FunctionDeclaration')
                        local.vars.set(s.id.name, { value: { fn: true, node: s, env: local }, constant: true });
                for (const s of n.body) {
                    const result = run(s, local);
                    if (result?.signal)
                        return result;
                }
                return;
            }
            case 'EmptyStatement':
            case 'FunctionDeclaration':
                return;
            case 'VariableDeclaration':
                for (const d of n.declarations) {
                    if (d.id.type !== 'Identifier' || e.vars.has(d.id.name))
                        throw new Error('Usá nombres de variables simples y distintos.');
                    e.vars.set(d.id.name, {
                        value: d.init ? run(d.init, e) : undefined,
                        constant: n.kind === 'const',
                    });
                }
                return;
            case 'Identifier':
                return binding(e, n.name).value;
            case 'Literal':
                return n.value;
            case 'ThisExpression':
                return self(e);
            case 'ExpressionStatement':
                run(n.expression, e);
                return;
            case 'FunctionExpression':
            case 'ArrowFunctionExpression':
                return { fn: true, node: n, env: e };
            case 'ArrayExpression':
                if (n.elements.length > 512)
                    throw new Error('Lista demasiado larga.');
                return n.elements.map((x) => (x ? run(x, e) : undefined));
            case 'MemberExpression':
                return member(run(n.object, e), n.computed ? run(n.property, e) : n.property.name, e, n.property.type === 'PrivateIdentifier');
            case 'AssignmentExpression': {
                const target = ref(n.left, e), old = n.operator === '=' ? undefined : target.get();
                const value = run(n.right, e);
                return target.set(n.operator === '=' ? value : binary(n.operator[0], old, value));
            }
            case 'UpdateExpression': {
                const target = ref(n.argument, e), old = target.get();
                const value = binary(n.operator === '++' ? '+' : '-', old, 1);
                target.set(value);
                return n.prefix ? value : old;
            }
            case 'CallExpression': {
                if (n.callee.type === 'Super') {
                    const c = context(e);
                    if (!c.owner.parent || c.initialized)
                        throw new Error('super(...) se llama una vez en el constructor de la subclase.');
                    initialize(c.owner.parent, c.self, n.arguments.map((a) => run(a, e)));
                    c.initialized = true;
                    initFields(c.owner, c.self);
                    return c.self;
                }
                const fn = run(n.callee, e);
                return invoke(fn, n.arguments.map((a) => run(a, e)));
            }
            case 'NewExpression':
                return construct(run(n.callee, e), n.arguments.map((a) => run(a, e)));
            case 'ClassDeclaration': {
                const parent = n.superClass ? run(n.superClass, e) : null;
                if (parent && parent.kind !== 'class')
                    throw new Error('extends necesita una clase de la actividad.');
                const cls = {
                    kind: 'class',
                    parent,
                    env: e,
                    fields: [],
                    methods: new Map(),
                    getters: new Map(),
                    setters: new Map(),
                    ctor: null,
                };
                for (const m of n.body.body) {
                    if (m.static || m.computed)
                        throw new Error('Usá miembros de instancia con nombres directos.');
                    if (m.type === 'PropertyDefinition')
                        cls.fields.push(m);
                    else if (m.kind === 'constructor')
                        cls.ctor = m.value;
                    else {
                        if (m.key.type === 'PrivateIdentifier')
                            throw new Error('Esta actividad usa atributos privados y métodos públicos.');
                        cls[m.kind === 'get' ? 'getters' : m.kind === 'set' ? 'setters' : 'methods'].set(m.key.name, m.value);
                    }
                }
                e.vars.set(n.id.name, { value: cls, constant: true });
                return;
            }
            case 'IfStatement':
                return run(run(n.test, e) ? n.consequent : n.alternate, e);
            case 'ConditionalExpression':
                return run(run(n.test, e) ? n.consequent : n.alternate, e);
            case 'ReturnStatement':
                return { signal: 'return', value: n.argument ? run(n.argument, e) : undefined };
            case 'BreakStatement':
                return { signal: 'break' };
            case 'ContinueStatement':
                return { signal: 'continue' };
            case 'ForStatement':
            case 'WhileStatement': {
                const loop = scope(e);
                if (n.init)
                    run(n.init, loop);
                while (!n.test || run(n.test, loop)) {
                    tick();
                    const result = run(n.body, loop);
                    if (result?.signal === 'return')
                        return result;
                    if (result?.signal === 'break')
                        break;
                    if (n.update)
                        run(n.update, loop);
                }
                return;
            }
            case 'ForOfStatement': {
                const list = run(n.right, e);
                if (!Array.isArray(list))
                    throw new Error('for...of necesita una lista.');
                for (const item of list) {
                    tick();
                    const loop = scope(e);
                    if (n.left.type === 'VariableDeclaration') {
                        run(n.left, loop);
                        binding(loop, n.left.declarations[0].id.name).value = item;
                    }
                    else
                        ref(n.left, loop).set(item);
                    const result = run(n.body, loop);
                    if (result?.signal === 'return')
                        return result;
                    if (result?.signal === 'break')
                        break;
                }
                return;
            }
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
                return n.operator === '!'
                    ? !a
                    : n.operator === '-'
                        ? -simple(a)
                        : n.operator === '+'
                            ? +simple(a)
                            : typeof a;
            }
            case 'BinaryExpression':
                return binary(n.operator, run(n.left, e), run(n.right, e));
            case 'TemplateLiteral': {
                let value = n.quasis[0].value.cooked;
                n.expressions.forEach((x, i) => {
                    value = simple(value + String(simple(run(x, e))) + n.quasis[i + 1].value.cooked);
                });
                return value;
            }
            default:
                throw new Error('Sintaxis no disponible: ' + n.type);
        }
    }
    function budget(action) {
        fuel = 16000;
        depth = 0;
        return action();
    }
    return {
        execute(ast) {
            instances = listeners = 0;
            logs.length = 0;
            root = scope(null);
            root.vars.set('document', { value: documentCap, constant: true });
            root.vars.set('console', { value: consoleCap, constant: true });
            root.vars.set('undefined', { value: undefined, constant: true });
            return budget(() => run(ast, root));
        },
        call(name, args) {
            return budget(() => invoke(binding(root, name).value, args));
        },
        construct(name, args) {
            return budget(() => construct(binding(root, name).value, args));
        },
        get(obj, key) {
            return budget(() => member(obj, key, root));
        },
        set(obj, key, value) {
            return budget(() => setMember(obj, key, value, root));
        },
        method(obj, key, args) {
            return budget(() => invoke(member(obj, key, root), args));
        },
        inherits(child, parent) {
            let c = binding(root, child).value.parent;
            const p = binding(root, parent).value;
            while (c) {
                if (c === p)
                    return true;
                c = c.parent;
            }
            return false;
        },
        privateField(obj, key) {
            return [...obj.privates.values()].some((values) => values.has(key)) && !obj.values.has(key);
        },
        selected() {
            return false;
        },
        logs,
    };
}
