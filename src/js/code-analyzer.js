import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse, userParams) => {
    initTraverseHandler();
    inithtmlTraverseHandler();
    let funcInput = esprima.parseScript(codeToParse);
    const jsParams = eval('[' + userParams + ']');
    let firstParsedTree = functionTraverse(funcInput.body[0], jsParams);
    let htmlData = createHtmlTag(firstParsedTree, '');
    return htmlData;
};

let traverseHandler = {};
let htmlTraverseHandler = {};

    const expTraverse = (ast, env, paramsEnv) => {
    try {
        return traverseHandler[ast.type](ast, env, paramsEnv);
    }
    catch (err) {
        throw err;
        return null;
    }
};

const functionTraverse = (ast, jsParams) => {
    var env = {};
    var paramsEnv = {};
    const params = ast.params.reduce((acc, p) => [...acc, p.name], []);
    params.map((p) => env[p] = p);
    for (var i = 0; i < jsParams.length; i++) {
        if(jsParams[i].length)
            paramsEnv[params[i]] = '[' + jsParams[i].toString() + ']';
        else
            paramsEnv[params[i]] = jsParams[i].toString();
    }
    var newBody = expTraverse(ast.body, env, paramsEnv);
    ast.body = newBody;
    return ast;
};

const blockTraverse = (ast, env, paramsEnv) => {
    var newBody = ast.body.map((bi) => expTraverse(bi, env, paramsEnv)).filter((bi) => {
        if (bi.type == 'ExpressionStatement'){
            return (paramsEnv[bi.expression.left.name] != undefined);
        }
        return (bi.type != 'VariableDeclaration');
    });
    ast.body = newBody;
    return ast;
};

const substitute = (env, exp) => {
    if (exp.type == 'Identifier') {
        exp['name'] = env[exp.name];
    }
    if (exp.type == 'BinaryExpression') {
        exp.left = substitute(env, exp.left);
        exp.right = substitute(env, exp.right);
    }
     if (exp.type == 'ArrayExpression') {
        exp.elements = exp.elements.map((member) => substitute(env, member));
    }
    if (exp.type == 'UnaryExpression') {
        exp.argument = substitute(env, exp.argument);
    }
    if (exp.type == 'MemberExpression') {
        exp.object = substitute(env,exp.object);
        exp.property = substitute(env,exp.property);
    }
    return exp;
};

const variableDeclTraverse = (ast, env, paramsEnv) => {
    const updateEnv = (varDecl) => {
        var val = varDecl.init;
        if (val != undefined) {
            var pref = '';
            var post = '';
            if (val.type == 'BinaryExpression') {
                pref = '(';
                post = ')';
            }
            env[varDecl.id.name] = pref + escodegen.generate(substitute(env, val),{format:{compact:true}}) + post;
        }
        else env[varDecl.id.name] = null;
    };
    ast.declarations.map(updateEnv);
    return ast;
};

const assignmentExpTraverse = (ast, env, paramsEnv) => {
    var pref = '';
    var post = '';
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
    var newBody = expTraverse(ast.body, env,paramsEnv);
    ast.body = newBody;
    const isTestTrue = checkTest(ast.test, paramsEnv);
    ast['isTestTrue'] = isTestTrue;
    return ast;
};

const ifExpTraverse = (ast, env, paramsEnv) => {
    let newEnv = Object.assign({}, env);
    ast.test = substitute(newEnv, ast.test);
    const ifConseqRows = expTraverse(ast.consequent, Object.assign({}, newEnv), paramsEnv);
    const ifAlterRows = expTraverse(ast.alternate, Object.assign({}, newEnv), paramsEnv);
    ast.consequent = ifConseqRows;
    ast.alternate = ifAlterRows;
    const isTestTrue = checkTest(ast.test, paramsEnv);
    ast['isTestTrue'] = isTestTrue;
    return ast;
};

const checkTest = (ast, paramsEnv) => {
    const genCode = escodegen.generate(ast);
    var newAst = esprima.parseScript(genCode);
    newAst = substitute(paramsEnv, newAst.body[0].expression);
    const result = eval(escodegen.generate(newAst));
    return result;
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
    return createHtmlTag(ast.expression,indentation);
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
