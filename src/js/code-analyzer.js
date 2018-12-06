import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const getDataFromCode = (codeToParse) => {
    initTraverseHandler();
    let funcInput = esprima.parseScript(codeToParse, {loc: true});
    return expTraverse(funcInput);
};

const makeRowExp = (type, line, name, value, condition = '') => {
    return {line: line, type: type, name: name, condition: condition, value: value};
};

let traverseHandler = {};

const expConcatReducer = (acc, exp) => acc.concat(expTraverse(exp));

const expTraverse = (ast) => {
    try {
        return traverseHandler[ast.type](ast);
    }
    catch (err){
        return [];
    }
};


const programTraverse = (ast) => {
    const programBodyRows = ast.body.reduce(expConcatReducer, []);
    return [...programBodyRows];
};

const functionTraverse = (ast) => {
    const params = ast.params.map((param) =>
        makeRowExp(param.type, param.loc.start.line, param.name, ''));
    const functionExp = makeRowExp(ast.type, ast.loc.start.line, ast.id.name, '');
    const funcBody = expTraverse(ast.body);
    return [functionExp, ...params, ...funcBody];
};

const blockTraverse = (ast) => {
    const funcBody = ast.body.reduce(expConcatReducer, []);
    return [ ...funcBody];
};

const variableDeclTraverse = (ast) => {
    return ast.declarations.reduce((acc, varDecl) =>
        acc.concat(makeRowExp(ast.type, varDecl.loc.start.line, varDecl.id.name, varDecl.init ? varDecl.init.value : '')), []);
};

const assignmentExpTraverse = (ast) => {
    const rightExpValue = escodegen.generate(ast.right);
    const assignmentExp = makeRowExp(ast.type,
        ast.loc.start.line, ast.left.name, rightExpValue);
    return [assignmentExp];
};

const whileExpTraverse = (ast) => {
    const condition = escodegen.generate(ast.test);
    const whileBodyRows = expTraverse(ast.body);
    const whileExp = makeRowExp(ast.type, ast.loc.start.line, '', '', condition);
    return [whileExp, ...whileBodyRows];
};

const ifExpTraverse = (ast) => {
    const condition = escodegen.generate(ast.test);
    const ifConseqRows = expTraverse(ast.consequent);
    const ifAlterRows = expTraverse(ast.alternate);
    const ifExp = makeRowExp(ast.type, ast.loc.start.line, '', '', condition);
    return [ifExp, ...ifConseqRows, ...ifAlterRows];
};

const forExpTraverse = (ast) => {
    const assignmentRow = expTraverse(ast.init);
    const conditionRow = escodegen.generate(ast.test);
    const updateRow = expTraverse(ast.update);
    const forBodyRows = expTraverse(ast.body);
    const forExp = makeRowExp(ast.type, ast.loc.start.line, '', '', conditionRow);
    return [forExp, ...assignmentRow, ...updateRow, ...forBodyRows];
};

const updateExpTraverse = (ast) => {
    return [makeRowExp(ast.type, ast.loc.start.line, ast.argument.name, ast.operator)];
};

const returnTraverse = (ast) => {
    const returnExp = makeRowExp(ast.type, ast.loc.start.line, '', escodegen.generate(ast.argument));
    return [returnExp];
};

const genExpTraverse = (ast) => {
    return expTraverse(ast.expression);
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


export {parseCode, getDataFromCode, expTraverse};
