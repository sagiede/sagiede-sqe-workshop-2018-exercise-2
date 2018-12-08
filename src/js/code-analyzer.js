import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse, userParams) => {
    initTraverseHandler();
    inithtmlTraverseHandler();
    let funcInput = esprima.parseScript(codeToParse);
    const jsParams = eval('[' + userParams + ']');
    let firstParsedTree = functionTraverse(funcInput.body[0], jsParams);
    return createHtmlTag(firstParsedTree, '');
};

let traverseHandler = {};
let htmlTraverseHandler = {};

const expTraverse = (ast, env, paramsEnv) => {
    try {
        return traverseHandler[ast.type](ast, env, paramsEnv);
    }
    catch (err) {
        throw err;
    }
};

const functionTraverse = (ast, jsParams) => {
    let env = {};
    let paramsEnv = {};
    const params = ast.params.reduce((acc, p) => [...acc, p.name], []);
    params.map((p) => env[p] = p);
    for (let i = 0; i < jsParams.length; i++) {
        if (jsParams[i].length)
            paramsEnv[params[i]] = '[' + jsParams[i].toString() + ']';
        else
            paramsEnv[params[i]] = jsParams[i].toString();
    }
    ast.body = expTraverse(ast.body, env, paramsEnv);
    return ast;
};

const blockTraverse = (ast, env, paramsEnv) => {
    ast.body = ast.body.map((bi) => expTraverse(bi, env, paramsEnv)).filter((bi) => {
        if (bi.type == 'ExpressionStatement') {
            return (paramsEnv[bi.expression.left.name] != undefined);
        }
        return (bi.type != 'VariableDeclaration');
    });
    return ast;
};

const substitute = (env, exp) => {
    if (exp.type == 'Identifier') {
        exp['name'] = env[exp.name];
    }
    else if (exp.type == 'BinaryExpression') {
        exp.left = substitute(env, exp.left);
        exp.right = substitute(env, exp.right);
    }
    else if (exp.type == 'ArrayExpression') {
        exp.elements = exp.elements.map((member) => substitute(env, member));
    }
    else if (exp.type == 'UnaryExpression') {
        exp.argument = substitute(env, exp.argument);
    }
    return substituteMember(env, exp);
};

const substituteMember = (env, exp) => {
    if (exp.type == 'MemberExpression') {
        exp.object = substitute(env, exp.object);
        exp.property = substitute(env, exp.property);
    }
    return exp;
};

const variableDeclTraverse = (ast, env) => {
    const updateEnv = (varDecl) => {
        let val = varDecl.init;
        if (val != undefined) {
            let pref = '';
            let post = '';
            if (val.type == 'BinaryExpression') {
                pref = '(';
                post = ')';
            }
            env[varDecl.id.name] = pref + escodegen.generate(substitute(env, val), {format: {compact: true}}) + post;
        }
        else env[varDecl.id.name] = null;
    };
    ast.declarations.map(updateEnv);
    return ast;
};

const assignmentExpTraverse = (ast, env) => {
    let pref = '';
    let post = '';
    if (ast.right.type == 'BinaryExpression') {
        pref = '(';
        post = ')';
    }
    extendsEnv(ast.left, pref + escodegen.generate(substitute(env, ast.right)) + post, env);
    return ast;
};

const whileExpTraverse = (ast, env, paramsEnv) => {
    env = Object.assign({}, env);
    ast.test = substitute(env, ast.test);
    ast.body = expTraverse(ast.body, env, paramsEnv);
    ast['isTestTrue'] = checkTest(ast.test, paramsEnv);
    return ast;
};

const ifExpTraverse = (ast, env, paramsEnv) => {
    let newEnv = Object.assign({}, env);
    ast.test = substitute(newEnv, ast.test);
    const ifConseqRows = expTraverse(ast.consequent, Object.assign({}, newEnv), paramsEnv);
    const ifAlterRows = expTraverse(ast.alternate, Object.assign({}, newEnv), paramsEnv);
    ast.consequent = ifConseqRows;
    ast.alternate = ifAlterRows;
    ast['isTestTrue'] = checkTest(ast.test, paramsEnv);
    return ast;
};

const checkTest = (ast, paramsEnv) => {
    const genCode = escodegen.generate(ast);
    let newAst = esprima.parseScript(genCode);
    newAst = substitute(paramsEnv, newAst.body[0].expression);
    return eval(escodegen.generate(newAst));
};

const returnTraverse = (ast, env, paramsEnv) => {

    ast.argument = substitute(env, ast.argument, paramsEnv);
    return ast;
};

const genExpTraverse = (ast, env, paramsEnv) => {
    ast.expression = expTraverse(ast.expression, env, paramsEnv);
    return ast;
};

const extendsEnv = (ast, rightSide, env) => {
    if (ast.type == 'Identifier') {
        env[ast.name] = rightSide;
    }
    else if (ast.type == 'MemberExpression') {
        env[escodegen.generate(ast)] = rightSide;
    }
};


const initTraverseHandler = () => {
    traverseHandler['WhileStatement'] = whileExpTraverse;
    traverseHandler['IfStatement'] = ifExpTraverse;
    traverseHandler['VariableDeclaration'] = variableDeclTraverse;
    traverseHandler['ReturnStatement'] = returnTraverse;
    traverseHandler['ExpressionStatement'] = genExpTraverse;
    traverseHandler['AssignmentExpression'] = assignmentExpTraverse;
    traverseHandler['BlockStatement'] = blockTraverse;
};

const createHtmlTag = (ast, indentation) => {
    if (ast)
        return htmlTraverseHandler[ast.type](ast, indentation);
    else
        return '';
};


const functionTraverseHtml = (ast, indentation) => {
    const params = ast.params.reduce((acc, p) => [...acc, p.name], []);
    let html = '<br>';
    html += 'function ' + ast.id.name + '(';
    params.map((p) => html += p + ',');
    html += ')';
    return html + createHtmlTag(ast.body, indentation + '  ');
};

const blockTraverseHtml = (ast, indentation) => {
    let html = indentation + '{<br>';
    ast.body.map((exp) => html += (createHtmlTag(exp, indentation) + '<br>'));
    html += indentation + '}<br>';
    return html;
};

const ifExpTraverseHtml = (ast, indentation) => {
    let html = indentation + 'if ';
    let color;
    if (ast.isTestTrue) color = 'green';
    else color = 'red';
    html += '<span style="background-color:' + color + ';">(' + escodegen.generate(ast.test) + ')</span>';
    html += '<br>';
    html += createHtmlTag(ast.consequent, indentation + '  ');
    if (ast.alternate) {
        html += indentation + 'else' + '<br>' + createHtmlTag(ast.alternate, indentation + '  ');
    }
    return html;
};

const whileExpTraverseHtml = (ast, indentation) => {
    let html = indentation + 'while ';
    let color;
    if (ast.isTestTrue) color = 'green';
    else color = 'red';
    html += '<span style="background-color:' + color + ';">(' + escodegen.generate(ast.test) + ')</span>';
    html += '<br>';
    html += createHtmlTag(ast.body, indentation + '  ');
    return html;
};

const returnTraverseHtml = (ast, indentation) => {
    return indentation + escodegen.generate(ast);
};

const genExpTraverseHtml = (ast, indentation) => {
    return createHtmlTag(ast.expression, indentation);
};

const assignmentExpTraverseHtml = (ast, indentation) => {
    return indentation + escodegen.generate(ast);
};


const inithtmlTraverseHandler = () => {
    htmlTraverseHandler['FunctionDeclaration'] = functionTraverseHtml;
    htmlTraverseHandler['BlockStatement'] = blockTraverseHtml;
    htmlTraverseHandler['WhileStatement'] = whileExpTraverseHtml;
    htmlTraverseHandler['IfStatement'] = ifExpTraverseHtml;
    htmlTraverseHandler['ReturnStatement'] = returnTraverseHtml;
    htmlTraverseHandler['ExpressionStatement'] = genExpTraverseHtml;
    htmlTraverseHandler['AssignmentExpression'] = assignmentExpTraverseHtml;
};


export {parseCode, expTraverse};
