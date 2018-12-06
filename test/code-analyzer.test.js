import assert from 'assert';
import {parseCode, getDataFromCode,expTraverse} from '../src/js/code-analyzer';

describe('parser Tests', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple Identifier correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });
});

describe('The javascript Traversers', () => {
    it('empty program', () => {
        assert.deepEqual(getDataFromCode(''), []);
    });

    it('VariableDeclaration', () => {
        assert.deepEqual(getDataFromCode('let x,y;'),
            [{'line': 1, 'type': 'VariableDeclaration', 'name': 'x', 'condition': '', 'value': ''}, {
                'line': 1,
                'type': 'VariableDeclaration',
                'name': 'y',
                'condition': '',
                'value': ''
            }]);
    });

    it('AssignmentExpression', () => {
        assert.deepEqual(getDataFromCode('let x,y;\n x = 5;')[2], {
            'line': 2,
            'type': 'AssignmentExpression',
            'name': 'x',
            'condition': '',
            'value': '5'
        });
    });

    it('UpdateExpression', () => {
        assert.deepEqual(getDataFromCode('let x,y;\n x = 5;\n x++;')[3], {
            'line': 3,
            'type': 'UpdateExpression',
            'name': 'x',
            'condition': '',
            'value': '++'
        });
    });

    it('WhileStatement', () => {
        assert.deepEqual(getDataFromCode('let i =0;\n' +
            'while (i < 5){\n' +
            'i++;\n' +
            '}\n' +
            'i = i +5;')
            ,[{'line': 1, 'type': 'VariableDeclaration', 'name': 'i', 'condition': '', 'value': 0},
            {'line': 2, 'type': 'WhileStatement', 'name': '', 'condition': 'i < 5', 'value': ''},
            {'line': 3, 'type': 'UpdateExpression', 'name': 'i', 'condition': '', 'value': '++'},
            {'line': 5, 'type': 'AssignmentExpression', 'name': 'i', 'condition': '', 'value': 'i + 5'}]);
    });

    it('IfElseStatement', () => {
        assert.deepEqual(getDataFromCode('if (X < V[mid])\n' +
            '            high = mid - 1;\n' +
            '        else if (X > V[mid])\n' +
            '            low = mid + 1;\n' +
            '        else\n' +
            '            low = mid - 1;'),
        [{'line':1,'type':'IfStatement','name':'','condition':'X < V[mid]','value':''},
            {'line':2,'type':'AssignmentExpression','name':'high','condition':'','value':'mid - 1'},
            {'line':3,'type':'IfStatement','name':'','condition':'X > V[mid]','value':''},
            {'line':4,'type':'AssignmentExpression','name':'low','condition':'','value':'mid + 1'},
            {'line':6,'type':'AssignmentExpression','name':'low','condition':'','value':'mid - 1'}]);
    });

    it('regularIfStatement', () => {
        assert.deepEqual(getDataFromCode('if (X < V[mid])\n' +
            '            low = mid - 1;'),
        [{'line':1,'type':'IfStatement','name':'','condition':'X < V[mid]','value':''},
            {'line':2,'type':'AssignmentExpression','name':'low','condition':'','value':'mid - 1'}]);
    });

    it('IfBlockStatement', () => {
        assert.deepEqual(getDataFromCode('if (X < V[mid])\n' +
            '            high = mid - 1;\n' +
            '        else if (X > V[mid])\n' +
            '            {low = mid + 1;}\n' +
            '        else\n' +
            '            {low = mid - 1;}'),
        [{'line':1,'type':'IfStatement','name':'','condition':'X < V[mid]','value':''},
            {'line':2,'type':'AssignmentExpression','name':'high','condition':'','value':'mid - 1'},
            {'line':3,'type':'IfStatement','name':'','condition':'X > V[mid]','value':''},
            {'line':4,'type':'AssignmentExpression','name':'low','condition':'','value':'mid + 1'},
            {'line':6,'type':'AssignmentExpression','name':'low','condition':'','value':'mid - 1'}]);
    });

    it('function and return statement', () => {
        assert.deepEqual(getDataFromCode('function binarySearch(x,n){\n' +
            '    return n;\n' +
            '}'),
        [{'line':1,'type':'FunctionDeclaration','name':'binarySearch','condition':'','value':''},
            {'line':1,'type':'Identifier','name':'x','condition':'','value':''},
            {'line':1,'type':'Identifier','name':'n','condition':'','value':''},
            {'line':2,'type':'ReturnStatement','name':'','condition':'','value':'n'}]);
    });

    it('ForStatement', () => {
        assert.deepEqual(getDataFromCode('for(i = 0; i<7; i++){\n' +
            '  x = x*x;\n' +
            '}  '),
        [{'line':1,'type':'ForStatement','name':'','condition':'i < 7','value':''},
            {'line':1,'type':'AssignmentExpression','name':'i','condition':'','value':'0'},
            {'line':1,'type':'UpdateExpression','name':'i','condition':'','value':'++'},
            {'line':2,'type':'AssignmentExpression','name':'x','condition':'','value':'x * x'}]);
    });

    it('badAst', () => {
        assert.deepEqual(expTraverse({type:'Bad AST'}),[]);
    });

});

const fullFuncString = 'function binarySearch(X, V, n){\n' +
    '    let low, high, mid;\n' +
    '    low = 0;\n' +
    '    high = n - 1;\n' +
    '    while (low <= high) {\n' +
    '        mid = (low + high)/2;\n' +
    '        if (X < V[mid])\n' +
    '            high = mid - 1;\n' +
    '        else if (X > V[mid])\n' +
    '            low = mid + 1;\n' +
    '        else\n' +
    '            return mid;\n' +
    '    }\n' +
    '    return -1;\n' +
    '}';

describe('full program Tests', () => {
    it('checking program that includes all exps ', () => {assert.deepEqual(getDataFromCode(fullFuncString),
        [{'line':1,'type':'FunctionDeclaration','name':'binarySearch','condition':'','value':''},
            {'line':1,'type':'Identifier','name':'X','condition':'','value':''},
            {'line':1,'type':'Identifier','name':'V','condition':'','value':''},
            {'line':1,'type':'Identifier','name':'n','condition':'','value':''},
            {'line':2,'type':'VariableDeclaration','name':'low','condition':'','value':''},
            {'line':2,'type':'VariableDeclaration','name':'high','condition':'','value':''},
            {'line':2,'type':'VariableDeclaration','name':'mid','condition':'','value':''},
            {'line':3,'type':'AssignmentExpression','name':'low','condition':'','value':'0'},
            {'line':4,'type':'AssignmentExpression','name':'high','condition':'','value':'n - 1'},
            {'line':5,'type':'WhileStatement','name':'','condition':'low <= high','value':''},
            {'line':6,'type':'AssignmentExpression','name':'mid','condition':'','value':'(low + high) / 2'},
            {'line':7,'type':'IfStatement','name':'','condition':'X < V[mid]','value':''},
            {'line':8,'type':'AssignmentExpression','name':'high','condition':'','value':'mid - 1'},
            {'line':9,'type':'IfStatement','name':'','condition':'X > V[mid]','value':''},
            {'line':10,'type':'AssignmentExpression','name':'low','condition':'','value':'mid + 1'},
            {'line':12,'type':'ReturnStatement','name':'','condition':'','value':'mid'},
            {'line':14,'type':'ReturnStatement','name':'','condition':'','value':'-1'}]);});
});