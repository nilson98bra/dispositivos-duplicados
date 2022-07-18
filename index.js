import 'dotenv/config'
import {connectionDB,getDuplicatedDevicesInDB,updateStatus} from './js/database.js'
import {getToken,getDuplicatedDevicesInKG} from './js/apiKg.js'
import {generateExcel} from './js/generateExcel.js'

(async()=>{
    const conn = await connectionDB();
    if(conn){
        const devices = await getDuplicatedDevicesInDB(conn);
        const token = await getToken();
        const result = await getDuplicatedDevicesInKG(devices,token);
        const imeis=result[0];
        console.log(imeis)
        const devicesNotDuplicated = result[1];
        if(devicesNotDuplicated) await updateStatus(conn,devicesNotDuplicated)
        await generateExcel(imeis);
        process.exit();
    }  
})()


