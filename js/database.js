import mysql from 'promise-mysql'
import {statusFromSamsung} from '@soudi/allied-kernel';
import 'dotenv/config'

export async function connectionDB(){
    let conn
    try{
        conn = await mysql.createConnection({
            host: process.env.HOST_DB,
            user: process.env.USER_DB,
            password: process.env.PASSW_DB,
            database: process.env.NAME_DB,
            port:process.env.PORT_DB,
            multipleStatements: true
          });         
               
    }
    catch(err){
        throw err
    }
    return conn?conn:null
}



export async function getDuplicatedDevicesInDB(connection){
    const query = `SELECT * FROM linxMovimentoSerial WHERE status_kdp = 'Duplicated' AND status_kg = 'Not Uploaded' ORDER BY 1 DESC;`
    let response;
    try{         
          response = await connection.query(query);                  
    }
    catch(err){
        connection.end();
        throw err
    }
      return response?response:null;
}



export async function updateStatus(connection,devices){
    if(devices.length>0){
        const query = devices.map(device=>{
            return `update linxMovimentoSerial set status_kdp = 'Verified', status_kg='${device.status}', status = '${statusFromSamsung(String(device.status).toLowerCase())}' where serial = '${device.deviceUid}'; `
        }).join('')
        try{         
              await connection.query(query);                  
        }
        catch(err){
            connection.end();
            throw err
        }
            connection.end();
            console.log("==================Terminou os Updates================")
    }
    else{
        console.log("==================Não tem Devices Duplicados================")
    }

}