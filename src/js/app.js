import $ from 'jquery';
import {parseCode , getDataFromCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let codeExpsTable = getDataFromCode(codeToParse);
        makeTable(codeExpsTable);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});

const makeTable = (codeExpsTable) => {
    let tableHeader = '<tr>\n' +
        '        <th>Line</th>\n' +
        '        <th>Type</th>\n' +
        '        <th>Name</th>\n' +
        '        <th>Condition</th>\n' +
        '        <th>Value</th>\n' +
        '    </tr>';
    let htmlData = codeExpsTable.reduce( (acc,jsonExp) => acc +
        '<tr>' +
        '<td>' + '<span>' + jsonExp.line + '</span>' + '</td>' +
        '<td>' + '<span>' + jsonExp.type + '</span>' + '</td>' +
        '<td>' + '<span>' + jsonExp.name + '</span>' + '</td>' +
        '<td>' + '<span>' + jsonExp.condition + '</span>' + '</td>' +
        '<td>' + '<span>' + jsonExp.value + '</span>' + '</td>' +
        '</tr>',tableHeader);
    $('#expsTable').html(htmlData);
};
