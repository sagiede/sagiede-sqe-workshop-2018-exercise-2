import assert from 'assert';
import {parseCode, getDataFromCode, expTraverse} from '../src/js/code-analyzer';

describe('general Test', () => {
    const userInput = '11,[100,101,true]';
    let funcInput = 'function foo(x,y){\n' +
        '    let a = [x,x+1,x+2];\n' +
        '    let b;\n' +
        '    b = a[1]-a[0];\n' +
        '    let c = 12;\n' +
        '    if(a[b] < c){\n' +
        '      b = 0;\n' +
        '      return y[b];\n' +
        '    }\n' +
        '    else{\n' +
        '       while(y[0] < 99){\n' +
        '         x = x +1;\n' +
        '         return b + 1;\n' +
        '       }\n' +
        '       while(y[0] < 101){\n' +
        '         c = c +1;\n' +
        '         return a[0];\n' +
        '       }\n' +
        '       b = 1;\n' +
        '      return y[b];\n' +
        '    }\n' +
        '}';
    const funcResult = '"<br>function foo(x,y)  {<br>  if <span style=\\"background-color:red;\\">([x,x+1,x+2][([x,x+1,x+2][1] - [x,x+1,x+2][0])] < 12)</span><br>    {<br>    return y[0];<br>    }<br>  else<br>    {<br>    while <span style=\\"background-color:red;\\">(y[0] < 99)</span><br>      {<br>      x = x + 1<br>      return ([x,x+1,x+2][1] - [x,x+1,x+2][0]) + 1;<br>      }<br><br>    while <span style=\\"background-color:green;\\">(y[0] < 101)</span><br>      {<br>      return [x,x+1,x+2][0];<br>      }<br><br>    return y[1];<br>    }<br><br>  }<br>"';
    it('func1', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput, userInput)), funcResult);
    });
});

describe('simple only function Tests', () => {
    const userInput1 = 'true';
    const funcInput1 = 'function foo(x){\n' +
        '    let a = true;\n' +
        '    let b = !a;\n' +
        '    let c = a & b;\n' +
        '    return c;\n' +
        '}';
    const funcResult1 ='"<br>function foo(x)  {<br>  return (true&!true);<br>  }<br>"';
    it('func2', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput1, userInput1)), funcResult1);
    });

    const userInput2 = '20';
    const funcInput2 = 'function foo(x){\n' +
        '    let a = [x,x+1];\n' +
        '    a[0] = 1;\n' +
        '    if(x > 1){\n' +
        '       return a[0];\n' +
        '    }\n' +
        '}';
    const funcResult2 ='"<br>function foo(x)  {<br>  if <span style=\\"background-color:green;\\">(x > 1)</span><br>    {<br>    return 1;<br>    }<br><br>  }<br>"';
    it('func3', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput2, userInput2)), funcResult2);
    });

    const userInput3 = '20';
    const funcInput3 = 'function foo(x){\n' +
        '    let a = [x,x+1];\n' +
        '    a[0] = 1;\n' +
        '    if(x > 1){\n' +
        '       return a[0];\n' +
        '    }\n' +
        '}';
    const funcResult3 ='"<br>function foo(x)  {<br>  if <span style=\\"background-color:green;\\">(x > 1)</span><br>    {<br>    return 1;<br>    }<br><br>  }<br>"';
    it('func3', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput3, userInput3)), funcResult3);
    });
});


describe('tests with outside vars and arrays', () => {
    const userInput1 = '0';
    const funcInput1 = 'let d = -1;\n' +
        'function foo(x){\n' +
        '    let a = 1;\n' +
        '    let b = a + 1;\n' +
        '    let c = d;\n' +
        '    if(d + x < 0)\n' +
        '       return d;\n' +
        '}';
    const funcResult1 ='"<br>function foo(x)  {<br>  if <span style=\\"background-color:green;\\">(-1 + x < 0)</span><br>    return -1;<br>  }<br>"';
    it('func1', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput1, userInput1)), funcResult1);
    });

    const userInput2 = '0';
    const funcInput2 = 'let d = 0;\n' +
        'function foo(x){\n' +
        '    let a = [1,2,3]\n' +
        '    a[d] = 100;\n' +
        '    return a[d];\n' +
        '}';
    const funcResult2 ='"<br>function foo(x)  {<br>  return 100;<br>  }<br>"';
    it('func1', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput2, userInput2)), funcResult2);
    });

    const userInput3 = '0';
    const funcInput3 = 'let d = 0;\n' +
        'function foo(x){\n' +
        '    let a = [1,2,3]\n' +
        '    a[d] = 100;\n' +
        '    return a[d+1];\n' +
        '}';
    const funcResult3 ='"<br>function foo(x)  {<br>  return [1,2,3][0 + 1];<br>  }<br>"';
    it('func1', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput3, userInput3)), funcResult3);
    });

    const userInput4 = '2,2';
    const funcInput4 = 'let a = 0;\n' +
        'let b = 1;\n' +
        'function foo(x,y){\n' +
        '    a = b + x;\n' +
        '    b = x * y * a;\n' +
        '    return b;\n' +
        '}';
    const funcResult4 ='"<br>function foo(x,y)  {<br>  return (x * y * (1 + x));<br>  }<br>"';
    it('func1', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput4, userInput4)), funcResult4);
    });

    const userInput5 = '2,2';
    const funcInput5 = 'let a = 0;\n' +
        'let b = 1;\n' +
        'function foo(x,y){\n' +
        '    a = b + x;\n' +
        '    b = true;\n' +
        '    return b;\n' +
        '}';
    const funcResult5 ='"<br>function foo(x,y)  {<br>  return true;<br>  }<br>"';
    it('func1', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput5, userInput5)), funcResult5);
    });

    const userInput6 = '[1,2,3],1';
    const funcInput6 = 'let a = 2;\n' +
        'function foo(x,y){\n' +
        '    let b = a;\n' +
        '    while(b < x[0]){\n' +
        '      b = b +1;\n' +
        '      y = a + b + 10;\n' +
        '    }\n' +
        '    return b + 10;\n' +
        '}';
    const funcResult6 ='"<br>function foo(x,y)  {<br>  while <span style=\\"background-color:red;\\">(2 < x[0])</span><br>    {<br>    y = 2 + (2 + 1) + 10<br>    }<br><br>  return 2 + 10;<br>  }<br>"';
    it('func1', () => {
        assert.deepEqual(JSON.stringify(parseCode(funcInput6, userInput6)), funcResult6);
    });
});
