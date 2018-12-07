import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
var evaluate = require('static-eval');

const parseCode = (codeToParse) => {
    initTraverseHandler();
    let funcInput = esprima.parseScript(codeToParse);
    //TODO GET PARAMS FROM BUTTON
    const paramsEnv = {x:22 , y:33 , z:44};
    let firstParsedTree = expTraverse(funcInput,{},paramsEnv);
    return escodegen.generate(firstParsedTree);
};

let traverseHandler = {};

const expTraverse = (ast,env,paramsEnv) => {
    try {
        return traverseHandler[ast.type](ast,env,paramsEnv);
    }
    catch (err){
        return null;
    }
};


const programTraverse = (ast,env,paramsEnv) => {
    return expTraverse(ast.body[0],env,paramsEnv);
};

const functionTraverse = (ast,env,paramsEnv) => {
    const params = ast.params.reduce((acc,p) => [...acc, p.name],[]);
    params.map((p) => env[p]=p);
    var newBody = expTraverse(ast.body,env,paramsEnv);
    ast.body = newBody;
    return ast;
};

const blockTraverse = (ast,env,paramsEnv) => {
    // var newBody = ast.body.map((bi) => expTraverse(bi,env));
    var newBody = ast.body.map((bi) => expTraverse(bi,env,paramsEnv)).filter((bi)=>
        (bi.type != 'VariableDeclaration') && (bi.type != 'ExpressionStatement'));
    ast.body = newBody;
    return ast;
};

const substitute = (env,exp) => {
    if(exp.type == 'Identifier'){
        exp['name'] = env[exp.name];
    }
    if(exp.type == 'BinaryExpression'){
        exp.left = substitute(env,exp.left);
        exp.right = substitute(env,exp.right);
    }
    return exp;
};


const variableDeclTraverse = (ast,env,paramsEnv) => {
    const updateEnv = (varDecl) => {
        var val = varDecl.init;
        if(val != undefined)
            env[varDecl.id.name] = escodegen.generate(substitute(env,val));
        else env[varDecl.id.name] = null;
    };
    ast.declarations.map(updateEnv);
    return ast;
};

const assignmentExpTraverse = (ast,env,paramsEnv) => {
    env[ast.left.name] = escodegen.generate(substitute(env,ast.right));
    return ast;
};

const whileExpTraverse = (ast,env,paramsEnv) => {
    env = Object.assign({},env);
    ast.test = substitute(env,ast.test);
    var newBody = expTraverse(ast.body,env);
    ast.body = newBody;
    const isTestTrue = checkTest(ast.test,paramsEnv);
    ast['isTestTrue'] = isTestTrue;
    return ast;
};


//TODO FIX
const checkTest = (ast,paramsEnv) =>{
    console.log('entereddd')
    const genCode = escodegen.generate(ast);
    const newAst = esprima.parseScript(genCode);
    //TODO -> NOW WE HAVE REGULAR AST THAT WE NEED TO EVALUATE:
    //TODO: OPTION 1: TRAVEL AST AND CHANGE IDENTIFIERS TO LITERALS
    //TODO: OPTION 2: FIND STATIC EVALUATOR THAT ACCEPT ENV AS ARG THAT DOES THAT.
    const res = evaluate(newAst,paramsEnv);
    console.log(genCode);
    console.log(newAst);
    console.log(res);

    //ast = substitute(paramsEnv,ast);
    const result = evaluate(ast);
    return result;

};

const ifExpTraverse = (ast,env,paramsEnv) => {
    env = Object.assign({},env);
    ast.test = substitute(env,ast.test);
    const ifConseqRows = expTraverse(ast.consequent,env,paramsEnv);
    const ifAlterRows = expTraverse(ast.alternate,env,paramsEnv);
    ast.consequent = ifConseqRows;
    ast.alternate = ifAlterRows;
    const isTestTrue = checkTest(ast.test,paramsEnv);
    ast['isTestTrue'] = isTestTrue;
    return ast;
};

//TODO For
const forExpTraverse = (ast,env,paramsEnv) => {
    const assignmentRow = expTraverse(ast.init,env,paramsEnv);
    const conditionRow = escodegen.generate(ast.test,env,paramsEnv);
    const updateRow = expTraverse(ast.update,env,paramsEnv);
    const forBodyRows = expTraverse(ast.body,env,paramsEnv);
    const forExp = makeRowExp(ast.type, ast.loc.start.line, '', '', conditionRow);
    return [forExp, ...assignmentRow, ...updateRow, ...forBodyRows];
};

const updateExpTraverse = (ast,env,paramsEnv) => {
    return ast;
};

const returnTraverse = (ast,env,paramsEnv) => {
    ast.argument = substitute(env,ast.argument,paramsEnv);
    return ast;
};

const genExpTraverse = (ast,env,paramsEnv) => {
    ast.expression =  expTraverse(ast.expression,env,paramsEnv);
    return ast;
};

const initTraverseHandler =  () => {
    traverseHandler['Program'] = programTraverse;
    traverseHandler['FunctionDeclaration'] = functionTraverse;
    traverseHandler['WhileStatement'] = whileExpTraverse;
    traverseHandler['IfStatement'] = ifExpTraverse;
    traverseHandler['ForStatement'] = forExpTraverse;
    traverseHandler['VariableDeclaration'] = variableDeclTraverse;
    traverseHandler['ReturnStatement'] = returnTraverse;
    traverseHandler['ExpressionStatement'] = genExpTraverse;
    traverseHandler['AssignmentExpression'] = assignmentExpTraverse;
    traverseHandler['UpdateExpression'] = updateExpTraverse;
    traverseHandler['BlockStatement'] = blockTraverse;
};


export {parseCode, expTraverse};
