import exceljs from 'exceljs'

export async function generateExcel(result){
    const workbook = new exceljs.Workbook();
    const sheet = workbook.addWorksheet("Devices");
    
    sheet.columns = [
        {header: 'IMEIs Duplicados', key: 'duplicados', width: 35}, 
        {header: 'IMEIs Não Duplicados', key: 'naoDuplicados', width: 35}, 
       ];
    
    if(result.duplicados.length >= result.naoDuplicados.length){
        result.duplicados.map((x,index)=>{
            const data = {'duplicados':x,'naoDuplicados':result.naoDuplicados[index]?result.naoDuplicados[index]:null};
            sheet.addRow(data);
        })
    }
    else{
        
        result.naoDuplicados.map((x,index)=>{
            const data = {'duplicados':result.duplicados[index]?result.duplicados[index]:null,'naoDuplicados':x};
            sheet.addRow(data)
        })
    }
    
    await sheet.workbook.xlsx.writeFile(`./excel/Duplicados-${Math.floor(Date.now() / 1000)}.xlsx`);
    console.log("=============Terminou==============");
    
}
