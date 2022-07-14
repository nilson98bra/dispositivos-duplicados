import fetch from 'node-fetch';
import mysql from 'promise-mysql'
import bluebird from 'bluebird'
import exceljs from 'exceljs'
import 'dotenv/config'

async function getDuplicatedDevicesInDB(){
    const query = `SELECT * FROM linxMovimentoSerial WHERE status_kdp = 'Duplicated' AND status_kg = 'Not Uploaded' ORDER BY 1 DESC limit 2;`

    let conn;
    let response;
    try{
        conn = await mysql.createConnection({
            host: process.env.HOST_DB,
            user: process.env.USER_DB,
            password: process.env.PASSW_DB,
            database: process.env.NAME_DB
          });
          
          response = await conn.query(query);
                   
    }
    catch(err){
        throw err
    }
    finally{
        if (conn && conn.end) conn.end();
    }
 
      return response?response:null;
}

async function getToken(){
    const body = {
        "user": process.env.USER_TOKEN,
        "password": process.env.PASSW_TOKEN
    }

        const response = await fetch('https://5wgm46o2gk.execute-api.us-east-1.amazonaws.com/acceptance/auth-ext/accesstoken', {
        method: 'post',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'}
    });
    const token = await response.json();
    return token.accessToken
}


async function getStatusKg(devices, token){
    const notDuplicated = []
    const duplicated = []
    if(!devices) {
        console.log("Não tem devices disponiveis", devices)
        return
    };

    await bluebird.Promise.map(devices, async (device)=>{
        const body = {
            "pageNum": 0,
            "pageSize": 1000,
            "credentialId":device.knox_credential_id,
            "search": device.serial
        }
        let response
        try{
             response = await fetch('https://stnu67hm7i.execute-api.us-east-1.amazonaws.com/acceptance/kg/devices/list', {
                method: 'post',
                body: JSON.stringify(body),
                headers: {'Content-Type': 'application/json',
                         'x-access-token':token}
            });
        }
        catch(err){
            console.log(err)
        }
        if(response){
            const result = await response.json();
            if(result.totalCount > 0){
                notDuplicated.push(device.serial)             
            } 
            else{
                 duplicated.push(device.serial)               
            }
        }
        
    },{ concurrency: Math.round(devices.length / 3) })
    console.log("Duplicados: ",duplicated.length)
    console.log("Não Duplicados ",notDuplicated.length)
    console.log(`Total ${duplicated.length + notDuplicated.length}`)
    return {
        "duplicados": duplicated,
        "naoDuplicados":notDuplicated    
        }
}

async function generateExcel(result){
    const workbook = new exceljs.Workbook()
    const sheet = workbook.addWorksheet("Devices")
    
    sheet.columns = [
        {header: 'IMEIs Duplicados', key: 'duplicados', width: 35}, 
        {header: 'IMEIs Não Duplicados', key: 'naoDuplicados', width: 35}, 
       ];
    
    result.duplicados.map((x,index)=>{
        const data = {'duplicados':`${x}`,'naoDuplicados':`${result.naoDuplicados[index]}`?result.naoDuplicados[index]:null}
        sheet.addRow(data)
    })

    await sheet.workbook.xlsx.writeFile(`./excel/Duplicados-${Math.floor(Date.now() / 1000)}.xlsx`)
    console.log("=============Terminou==============")
}

(async()=>{
    
    const devices = await getDuplicatedDevicesInDB();
    const token = await getToken();
    const result = await getStatusKg(devices,token);
    console.log(result.naoDuplicados)
    await generateExcel(result);
    

})()
