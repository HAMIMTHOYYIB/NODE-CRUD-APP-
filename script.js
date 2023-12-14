// const { error } = require('console');
const fs = require('fs');
const http = require('http')
const querystring = require("querystring");
// const { Script } = require('vm');

let html1 = fs.readFileSync('./Files/index.html' , 'utf-8')
let formpage = fs.readFileSync('./Files/form.html','utf-8')
let editform = fs.readFileSync('./Files/editform.html','utf-8')
let datas = JSON.parse(fs.readFileSync('./Data/files.json','utf-8'))


function upadtaeTable(datas) {
    let tableRows = '';
    datas.forEach((data, index) => {
        tableRows += `
            <tr id="row_${index + 1}">
                <td>${index + 1}</td>
                <td>${data.name}</td>
                <td>${data.age}</td>
                <td>${data.phone}</td>
                <td>${data.email}</td>
                <td>
                    <form action="/Edit" onsubmit="return reload()">
                        <input type="hidden" name="rowindex" value="${index + 1}">
                        <button type="submit" style="width:50%;height:25px; background-color:darkslategray;font-family: sans-serif;  border:none;color:white;margin:0 0 0 25%;">
                            Edit
                        </button>
                    </form>
                </td>
                <td>
                    <form action="/delete" method="post">
                        <input type="hidden" name="rowindex" value="${index + 1}">
                        <button type="submit" style="width:50%;height:25px;font-family: sans-serif; background-color:brown;border:none;color:white;margin:0 0 0 25%;">
                            Delete
                        </button>
                    </form>
                </td>
            </tr>`;
    });
    updatehtml = html1.replace(`<tbody style="border:2px solid black;background-color:skyblue;"></tbody>`, `<tbody style="border:2px solid black;background-color:skyblue;">${tableRows}</tbody>`);
    return updatehtml;
}

// To fill the data before showing the form.
function prefilledit(rowindex,rowData) { 
    const prefilled = `
    <div style="width:90%;height:550px;background-color:skyblue; margin: auto; box-sizing: border-box; padding:100px 200px;">
        <form id="editform" method="post" action="/submitedit" onsubmit="return submitedit(event)">
            <input type="hidden" name="rowindex" value="${rowindex}">
            
            <label for="Name"><b>Name : </b></label>
            <input style="width:300px;height:30px;border:2px solid black;font-weight:bold;" type="text" id="Name" value="${rowData.name}"><br>
            
            <label for="age"><b> Age :  &nbsp;&nbsp;</b></label>
            <input style="width:50px;height:30px;border:2px solid black;font-weight:bold;margin-top:15px;" type="number" id="age" value="${rowData.age}"><br>

            <label  for="phone"><b>phone : </b></label>
            <input style="width:200px;height:30px;border:2px solid black; margin-top:15px;font-weight:bold;" type="number" id="phone" value="${rowData.phone}"><br>

            <label  for="email"><b>email :  </b></label>
            <input style="width:200px;height:30px;border:2px solid black; margin-top:20px;font-weight:bold;" type="email" id="email" value="${rowData.email}"><br>
            <small id="mailerror" style="color:red; margin-left:50px; font-weight: bold;"></small><br>

            <input style="width:200px;border-radius:2px;border:2px solid black; margin:50px 50px;height:30px;" type="reset">
            <input style="width:200px;border-radius:2px;border:2px solid black; margin:50px 50px; height:30px;" type="submit">
        </form>
    </div>`

     editform = editform.replace(`<div id="main"></div>`,`<div id="main">${prefilled}</div>`);
     return editform;
}

const server = http.createServer((req,res) => {
    let path = req.url;
    try {

        // Home page
        if(req.method === 'GET' && (path === '/' || path === '/home' || path === '/list')){
            res.write(upadtaeTable(datas));
            res.end();
        }

        // Form page  on clicking add user;
        else if (req.method === 'GET' && path === '/Form') {
            res.writeHead(200 , {'content-type' : 'text/html'})
            res.write(formpage)
            res.end()
        }

        // Form is submitted and on submit, data has been saved to json file.
        else if (req.method === 'POST' && path === '/submit') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
                
                try {
                    const formData = querystring.parse(body);
                    const formDetail = JSON.parse(formData.formdetail);
                    datas.push(formDetail);
                  
                    fs.writeFile('./Data/files.json', JSON.stringify(datas, null,2), (err) => {
                        if (err) {
                            console.error(err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error on saving form data');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.write(upadtaeTable(datas));
                            res.end();
                        }
                    });
                } catch (error) {
                    console.log('error : ',error);
                    res.writeHead(400,{'Content-type' : 'text/plain'})
                    res.end('Invalid form data')
                }
            });
        }

        // On clicking delete button  the row is find by index no and the details in the row will be spliced out.
        else if (req.method === 'POST' && path === '/delete') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
                try {
                    const formData = querystring.parse(body);
                    const rowToDelete = parseInt(formData.rowindex);
        
                    if (!isNaN(rowToDelete) && rowToDelete > 0 && rowToDelete <= datas.length) {
                        datas.splice(rowToDelete - 1, 1); 
        
                        fs.writeFile('./Data/files.json', JSON.stringify(datas, null, 2), (err) => {
                            if (err) {
                                console.error(err);
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Error deleting data');
                            } else {
                                res.writeHead(302, { 'Location': '/home' });
                                res.end();
                            }
                        });
                    } else {
                        res.writeHead(400, { 'Content-Type': 'text/plain' });
                        res.end('Invalid row index');
                    }
                } catch (error) {
                    console.log('error : ', error);
                    res.writeHead(400, { 'Content-type': 'text/plain' });
                    res.end('Error deleting row');
                }
            });
        }

        // On clicking the edit button it will show the form page with prefilling the data.
        else if (req.method === 'GET' && path.startsWith('/Edit')) {
            
            try {
                const urlParts = req.url.split('?'); 
                if (urlParts.length > 1) {
                    const queryParams = urlParts.pop(); //takes the last part by poping (rowindex only)
                    console.log("Edit the "+queryParams)
                    const params = new URLSearchParams(queryParams);
                    const rowindex = parseInt(params.get('rowindex'));

                if (!isNaN(rowindex) && rowindex > 0 && rowindex <= datas.length) {
                    const rowdata = datas[rowindex - 1];
                    // prefilledit(rowindex,rowdata)
                    res.writeHead(200, { 'Content-type': 'text/html' });
                    res.write(prefilledit(rowindex,rowdata));
                    res.end();
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('Invalid row index for editing');
                }
            } catch (error) {
                console.log('Error: ', error);
                res.writeHead(400, { 'Content-type': 'text/plain' });
                res.end('Error on get the edit form');
            }
        }

        else if (req.method === 'POST' &&path === "/submitedit") {
            try {

                let body = '';
                req.on('data' , (chunk) => (body += chunk));
                req.on('end' , () => {
                    console.log(body);
                    try {
                        const formdata = querystring.parse(body)
                        console.log('eformdata :',formdata)
                        const updatedDetails = JSON.parse(formdata.eformdetail)
                        const rowindex = parseInt(formdata.rowindex)

                        if(!isNaN(rowindex) && rowindex > 0 && rowindex <= datas.length){
                            datas[rowindex - 1] = updatedDetails;

                            fs.writeFile('./data/files.json' , JSON.stringify(datas, null ,2) , (err) => {
                                if(err){
                                    console.log(err);
                                    res.writeHead(500 , {'Content-Type':'text/plain'})
                                    res.end('Error on updating datas of edit')
                                }else{
                                    res.writeHead(200,{'Content-Type':'text/html'});
                                    res.end(upadtaeTable(datas));
                                }
                            });
                        }else{
                            res.writeHead(400 , {'Content-Type':'text/plain'});
                            res.end('Error on the row number on edit');
                        }
                } catch (error) {
                    console.log('Error :',error);
                    res.writeHead(400,{'Content-Type':'text/plain'});
                    res.end('Error on updating the row')
                }
            });
            } catch (error) {
                console.log('Error :',error);
                res.writeHead(400,{'Content-Type':'text/plain'});
                res.end('Error on submiting the edit')
            }
        }

        //
         else {
            res.writeHead(404 , {'Content-type':'text/plain'})
            res.end('Cant find page')
        }
    } catch (error){
        res.writeHead(404,{'Content-type':'text/plain'})
        console.log(error)
        res.end(error);
    }
});
let port = 8000;
    server.listen(port,() => {
        console.log(`server running on http://localhost:${port}`)
})