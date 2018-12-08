import assert from 'assert';
import {parseCode, getDataFromCode, expTraverse} from '../src/js/code-analyzer';

describe('general Tests', () => {
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

describe('simple Tests', () => {
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