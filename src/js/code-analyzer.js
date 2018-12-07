import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    initTraverseHandler();
    inithtmlTraverseHandler();
    let funcInput = esprima.parseScript(codeToParse);
    //TODO GET PARAMS FROM BUTTON
    const paramsEnv = {x: 1, y: 2, z: 3};
    let firstParsedTree = expTraverse(funcInput, {}, paramsEnv);
    let htmlData = createHtmlTag(firstParsedTree,'');
    return htmlData;
};

let traverseHandler = {};
let htmlTraverseHandler = {};

const expTraverse = (ast, env, paramsEnv) => {
    try {
        return traverseHandler[ast.type](ast, env, paramsEnv);
    }
    catch (err) {
        return null;
    }
};

const programTraverse = (ast, env, paramsEnv) => {
    return expTraverse(ast.body[0], env, paramsEnv);
};

const functionTraverse = (ast, env, paramsEnv) => {
    const params = ast.params.reduce((acc, p) => [...acc, p.name], []);
    params.map((p) => env[p] = p);
    var newBody = expTraverse(ast.body, env, paramsEnv);
    ast.body = newBody;
    return ast;
};

const blockTraverse = (ast, env, paramsEnv) => {
    console.log(ast);
    // var newBody = ast.body.map((bi) => expTraverse(bi,env));
    var newBody = ast.body.map((bi) => expTraverse(bi, env, paramsEnv)).filter((bi) =>
        (bi.type != 'VariableDeclaration') && (bi.type != 'ExpressionStatement'));
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
    //TODO CHECK UNARY,MEMBER
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
            env[varDecl.id.name] = pref + escodegen.generate(substitute(env, val)) + post;
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
    env[ast.left.name] = pref + escodegen.generate(substitute(env, ast.right)) + post;
    return ast;
};

//TODO CHECK EXAMPLE WITH C++ IN TEST
const whileExpTraverse = (ast, env, paramsEnv) => {
    console.log('entered while');
    console.log(ast);
    env = Object.assign({}, env);
    ast.test = substitute(env, ast.test);
    var newBody = expTraverse(ast.body, env);
    ast.body = newBody;
    const isTestTrue = checkTest(ast.test, paramsEnv);
    ast['isTestTrue'] = isTestTrue;
    console.log('entered while2');
    console.log(ast);
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

const initTraverseHandler = () => {
    traverseHandler['Program'] = programTraverse;
    traverseHandler['FunctionDeclaration'] = functionTraverse;
    traverseHandler['WhileStatement'] = whileExpTraverse;
    traverseHandler['IfStatement'] = ifExpTraverse;
    traverseHandler['VariableDeclaration'] = variableDeclTraverse;
    traverseHandler['ReturnStatement'] = returnTraverse;
    traverseHandler['ExpressionStatement'] = genExpTraverse;
    traverseHandler['AssignmentExpression'] = assignmentExpTraverse;
    traverseHandler['BlockStatement'] = blockTraverse;
};

const createHtmlTag = (ast,indentation) => {
    if(ast)
        return htmlTraverseHandler[ast.type](ast,indentation);
    else
        return '';
};


const functionTraverseHtml = (ast,indentation) => {
    const params = ast.params.reduce((acc, p) => [...acc, p.name], []);
    let html = '<br>';
    html += 'function ' + ast.id.name + '(';
    params.map((p) => html += p + ',');
    html += ')';
    return html + createHtmlTag(ast.body , indentation + '  ');
};

const blockTraverseHtml = (ast,indentation) => {
    let html = indentation + '{<br>';
    ast.body.map((exp) => html += (createHtmlTag(exp,indentation) + '<br>'));
    html += indentation + '}<br>';
    return html;
};

const ifExpTraverseHtml = (ast,indentation) => {
    let html = indentation + 'if ';
    let color;
    if (ast.isTestTrue) color = 'green';
    else color = 'red';
    html += '<span style="background-color:' + color + ';">(' + escodegen.generate(ast.test) + ')</span>';
    html += '<br>';
    html +=  createHtmlTag(ast.consequent,indentation+'  ');
    if(ast.alternate){
        html += indentation + 'else'+ '<br>' + createHtmlTag(ast.alternate,indentation + '  ');
    }
    return html ;
};

const whileExpTraverseHtml = (ast,indentation) => {
    let html = indentation + 'while ';
    let color;
    if (ast.isTestTrue) color = 'green';
    else color = 'red';
    html += '<span style="background-color:' + color + ';">(' + escodegen.generate(ast.test) + ')</span>';
    html += '<br>';
    html +=  createHtmlTag(ast.body,indentation+'  ');
    return html ;
};

const returnTraverseHtml = (ast,indentation) => {
    return indentation + escodegen.generate(ast);
};


const inithtmlTraverseHandler = () => {
    htmlTraverseHandler['FunctionDeclaration'] = functionTraverseHtml;
    htmlTraverseHandler['BlockStatement'] = blockTraverseHtml;
    htmlTraverseHandler['WhileStatement'] = whileExpTraverseHtml;
    htmlTraverseHandler['IfStatement'] = ifExpTraverseHtml;
    htmlTraverseHandler['ReturnStatement'] = returnTraverseHtml;
};


export {parseCode, expTraverse};
