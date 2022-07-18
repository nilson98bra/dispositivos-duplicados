import fetch from 'node-fetch';
import bluebird from 'bluebird'
import { sleepTime } from './sleepTime.js';

export async function getToken(){
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


export async function getDuplicatedDevicesInKG(devices, token){
    const imeisNotDuplicated = [];
    const devicesNotDuplicated = [];
    const imeisDuplicated = [];
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
        console.log("Device atual: ",device.serial)
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
                imeisNotDuplicated.push(device.serial)
                devicesNotDuplicated.push(result.deviceList[0])
            }
            else imeisDuplicated.push(device.serial)                           
        }
        await sleepTime(2000)
    },{ concurrency: 40 })

    console.log("Duplicados: ",imeisDuplicated.length)
    console.log("Não Duplicados ",imeisNotDuplicated.length)
    console.log(`Total ${imeisDuplicated.length + imeisNotDuplicated.length}`)
    return [{
        "duplicados": imeisDuplicated,
        "naoDuplicados":imeisNotDuplicated    
    },devicesNotDuplicated]
}