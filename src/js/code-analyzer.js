import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    let funcInput1 = esprima.parseScript(codeToParse);
    // console.log(funcInput1);
    // funcInput1.body[0].expression.left.name = '<span>y</span>';
    // const result = escodegen.generate(funcInput1);
    // console.log('resultttttt');
    // console.log(result);
    initTraverseHandler();
    let funcInput = esprima.parseScript(codeToParse);
    //TODO GET PARAMS FROM BUTTON
    const paramsEnv = {x: 1, y: 2, z: 3};
    let firstParsedTree = expTraverse(funcInput, {}, paramsEnv);
    console.log(firstParsedTree);
    return escodegen.generate(firstParsedTree);
};

let traverseHandler = {};

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
            env[varDecl.id.name] = pref+escodegen.generate(substitute(env, val))+post;
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
    env[ast.left.name] = pref+escodegen.generate(substitute(env, ast.right))+post;
    return ast;
};

const whileExpTraverse = (ast, env, paramsEnv) => {
    env = Object.assign({}, env);
    ast.test = substitute(env, ast.test);
    var newBody = expTraverse(ast.body, env);
    ast.body = newBody;
    const isTestTrue = checkTest(ast.test, paramsEnv);
    ast.test = createIdHtmlTag(ast.test,isTestTrue);
    ast['isTestTrue'] = isTestTrue;
    return ast;
};
const createIdHtmlTag = (ast,isTestTrue) =>{
    let color;
    if(isTestTrue)
        color = 'green';
    else
        color = 'red';
    let testCode = escodegen.generate(ast);
    return {type:'Identifier',name:'<span style="background-color:'+ color+';">'+testCode +'</span>'};
};

const ifExpTraverse = (ast, env, paramsEnv) => {
    let newEnv = Object.assign({}, env);
    ast.test = substitute(newEnv, ast.test);
    const ifConseqRows = expTraverse(ast.consequent, Object.assign({}, newEnv), paramsEnv);
    const ifAlterRows = expTraverse(ast.alternate, Object.assign({}, newEnv), paramsEnv);
    ast.consequent = ifConseqRows;
    ast.alternate = ifAlterRows;
    const isTestTrue = checkTest(ast.test, paramsEnv);
    console.log('ast testtt');
    console.log(ast.test);
    ast.test = createIdHtmlTag(ast.test,isTestTrue);
    ast['isTestTrue'] = isTestTrue;
    return ast;
};

//TODO For
/*const forExpTraverse = (ast, env, paramsEnv) => {
    const assignmentRow = expTraverse(ast.init, env, paramsEnv);
    const conditionRow = escodegen.generate(ast.test, env, paramsEnv);
    const updateRow = expTraverse(ast.update, env, paramsEnv);
    const forBodyRows = expTraverse(ast.body, env, paramsEnv);
    const forExp = makeRowExp(ast.type, ast.loc.start.line, '', '', conditionRow);
    return [forExp, ...assignmentRow, ...updateRow, ...forBodyRows];
};*/

const checkTest = (ast, paramsEnv) => {
    const genCode = escodegen.generate(ast);
    var newAst = esprima.parseScript(genCode);
    newAst = substitute(paramsEnv, newAst.body[0].expression);
    const result = eval(escodegen.generate(newAst));
    return result;
};

const updateExpTraverse = (ast, env, paramsEnv) => {
    return ast;
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
    // traverseHandler['ForStatement'] = forExpTraverse;
    traverseHandler['VariableDeclaration'] = variableDeclTraverse;
    traverseHandler['ReturnStatement'] = returnTraverse;
    traverseHandler['ExpressionStatement'] = genExpTraverse;
    traverseHandler['AssignmentExpression'] = assignmentExpTraverse;
    traverseHandler['UpdateExpression'] = updateExpTraverse;
    traverseHandler['BlockStatement'] = blockTraverse;
};


export {parseCode, expTraverse};
