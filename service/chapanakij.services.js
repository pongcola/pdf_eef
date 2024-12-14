import axios from 'axios';
// import jwt from 'jwt-decode';


// ***  Chapanakij Login and Register ***
//      *** require data ***
// ***  string  client_id
// ***  string  client_secret
// ***  string  refcode
// ***  string  mobile_no
// ***  string  customer_id
export const mainService  = async (playload) =>{
    try {
            const resultChkmobile = await checkMobileService(playload)
            const resultChkAccount = await checkAccountService(playload)

            if(resultChkmobile.result & resultChkAccount.result){
                const accountIds = resultChkmobile.data
                const chkOneID = accountIds.includes(resultChkAccount.data);
                if(chkOneID){
                    
                    const responselogin = await loginMobile(playload)   // LogIN OneID With Mobile
                    if(responselogin.data){
                        
                        console.log('-------->0')
                        return { result: true , data: responselogin.data , status: 200, errorMessage: '3' }

                    } else return { result: false , data: {} , status: 401, errorMessage: 'login ไม่สำเร็จ' }

                } else return { result: false , data: {} , status: 401, errorMessage: 'account ID ไม่ตรงกัน'}

            } else if (!resultChkmobile.result &  !resultChkAccount.result) {


                const responseregisterMobile = await registerMobileAndLogin(playload) // Register OneID With Mobile
                // console.log(responseregisterMobile.data)
                if(responseregisterMobile.result){
                    console.log('-------->1')
                    return { result: true , data: responseregisterMobile.data , status: 200, errorMessage: '' }
                } else return { result: false , data: {} , status: 401, errorMessage: responseregisterMobile.data }

                // return { result: false, data: {}, errorMessage: 'ไม่พบข้อมูลเลขบัตรประชาชนและเบอร์โทรศัพท์ของท่านในระบบ'}
            } else if (resultChkmobile.result & !resultChkAccount.result) return resultChkAccount
            else if (!resultChkmobile.result & resultChkAccount.result) return resultChkmobile

    } catch (error) {
        console.log(error)
        return error
    }
}


async function checkMobileService (playload) {

    try {
        let accountId = []
        const listChkmobile = {
                client_id: playload.client_id,
                secret_key: playload.client_secret,
                refcode: playload.refcode,
                mobile_no: playload.mobile_no
        }

        // const sqlchkmobilePRD = `https://one.th/api/search_accountid_by_mobile`
        const sqlchkmobileUAT = `https://testoneid.inet.co.th/api/search_accountid_by_mobile` // Check OneID จาก เบอร์โทรศัพท์
        const response = await axios.post(sqlchkmobileUAT,listChkmobile)
        if(response.data){
            const data = response.data.data
            const checkResponse = JSON.stringify(data.list_accounts) === 'null' ? false : true
            if(checkResponse) {
                const arFind = data.list_accounts
                arFind.forEach(element => {
                    accountId.push(element.account_id)
                });
                console.log('-------->2')
                return { result: true, data: accountId, errorMessage:''}
            } else return { result: false, data: {}, errorMessage:'เบอร์โทรศัพท์ของท่านไม่มี Account ID ในระบบ'} 
        
        }
    } catch (error) {
        console.log(error)
        return error
    }
}

async function checkAccountService (playload) {
    try {

        const listChkaccount = {
            client_id: playload.client_id,
            secret_key: playload.client_secret,
            ref_code: playload.refcode,
            id_card: playload.customer_id
        }

        // const sqlchkaccountPRD = `https://one.th/api/search_username_by_id_card`
        const sqlchkaccountUAT = `https://testoneid.inet.co.th/api/search_username_by_id_card` // Check OneID จาก บัตรประชาชน
        const response = await axios.post(sqlchkaccountUAT,listChkaccount)
        if(response.data){
            const data = response.data.data
            console.log('-------->3')
            return  { result: true, data: response.data.data.account_id, errorMessage:''}
            
        } else return {result: false, data: {}, errorMessage: 'หมายเลขบัตรประชาชนของท่านไม่มี Account ID ในระบบ'} 

      
    } catch (error) {
        console.log(error)
        if(error.response.data.errorMessage == 'This id_card not found.') return { result: false, data: {} , errorMessage: 'หมายเลขบัตรประชาชนของท่านไม่มี Account ID ในระบบ'}
        else return { result: false, data: {} , errorMessage: error.response.data.errorMessage}
    }
}


async function loginMobile(playload){
    try {
        const formLogin = {
            client_id: playload.client_id,
            client_secret: playload.client_secret,
            refcode: playload.refcode,
            mobile_no: playload.mobile_no
        }
        // const sqllogPRD = `https://one.th/api/oauth/taxbox/otp`
        const sqllogUAT = `https://testoneid.inet.co.th/api/oauth/taxbox/otp`  // Login
        const responselogUp = await axios.post (sqllogUAT,formLogin)
        console.log('--- responselogUp ---',responselogUp.data)
        if(responselogUp.data.result === 'Success'){
            console.log('-------->4')
            return { result: true , data: responselogUp.data.data , status: 200, errorMessage: '1' }
        } else return { result: false , data: {} , status: 401, errorMessage: responselogUp.data.data }
        
    } catch (error) {
        console.log(error)
        if(error.response.data.errorMessage === 'Mobile_no not found') return { result: false, data: {} , errorMessage:'กรุณาตั้งค่าใช้เบอร์โทรศัพท์ในการ Login'}
        else return error
    }   
}


async function loginMobileConfirm(playload,otp){
    try {
        const formLoginConfirm = {
            client_id: playload.client_id,
            client_secret: playload.client_secret,
            refcode: playload.refcode,
            mobile_no: playload.mobile_no,
            otp: otp
        }
        // const sqllogPRD = `https://one.th/api/oauth/taxbox/otp/confirm`
        const sqlloginConfirmUAT = `https://testoneid.inet.co.th/api/oauth/taxbox/otp/confirm`  // Confirm Login
        const responseloginConfirm = await axios.post (sqlloginConfirmUAT,formLoginConfirm)
        if(responseloginConfirm.data.result === 'Success'){
            
            console.log('----> responseloginConfirm',responseloginConfirm.data)
            
            console.log('-------->6')
            return { result: true , data: responseloginConfirm.data, status: 200, errorMessage: '6' }
        } else return { result: false , data: {} , status: 401, errorMessage: responseloginConfirm.data.data }
        
    } catch (error) {
        console.log(error)
        return error
    }   
}


async function registerMobileAndLogin (playload){
    try {

        const formRegis = {
            client_id: playload.client_id,
            client_secret: playload.client_secret,
            refcode: playload.refcode,
            mobile_no: playload.mobile_no
        }

        // const sqlRegisPRD = `https://one.th/api/register/mobile`
        const sqlRegisUAT = `https://testoneid.inet.co.th/api/register/mobile` // register
        const responseRegis = await axios.post (sqlRegisUAT,formRegis) 
        if(responseRegis.data.result){
            const formConfirmRegis = {
                client_id: playload.client_id,
                client_secret: playload.client_secret,
                refcode: playload.refcode,
                mobile_ref_id: responseRegis.data.data.mobile_ref_id,
                otp: responseRegis.data.data.otp,
                flg_term: "ยอมรับนโยบาย"
              }
            // const sqlConfirmRegisPRD = `https://one.th/api/register/mobile/confirm`
            const sqlConfirmRegisUAT = `https://testoneid.inet.co.th/api/register/mobile/confirm` // confirm register
            const resConfirmRegis = await axios.post (sqlConfirmRegisUAT,formConfirmRegis) 
            if(resConfirmRegis.data.result === "Success"){
                const responseRlogin = await loginMobile(playload)   // LogIN OneID With Mobile
                if(responseRlogin.data){
                    const otplogin = responseRlogin.data.otp
                    const responseConlogin = await loginMobileConfirm(playload,otplogin)   // confirm LogIN OneID With Mobile
                    if(responseConlogin.result){
                        const tokenLog = responseConlogin.data.access_token
                        const CusID = playload.customer_id

                        const resultInprofile = await profile(CusID,tokenLog)
                        if(resultInprofile.result === 'Success'){

                            console.log('-------->5')
                            return { result: true , data: resultInprofile.data , status: 200, errorMessage: '' }
                        } else return { result: false , data: {} , status: 401, errorMessage: resultInprofile.data }

                    } else return { result: false , data: {} , status: 401, errorMessage: responseConlogin.data }

                } else return { result: false , data: {} , status: 401, errorMessage: responseRlogin.data }

            } else return { result: false , data: resConfirmRegis.data.data , status: 401, errorMessage: resConfirmRegis.data.errorMessage }

        } else return { result: false , data: {} , status: 401, errorMessage: responseRegis.data.data }
                
    } catch (error) {
        console.log(error)
        return error
    }

}


async function profile(CusID,token) {

    try {
        let chkresult = {}
        const data = {
            id_card_type: "ID_CARD",
            id_card_num: CusID
        };
        const tokenIn = `Bearer ${token}`
        const config = {
            method: 'post',
            // url: 'https://one.th/api/insert_profile',
            url: 'https://testoneid.inet.co.th/api/insert_profile',
            headers: { 
                'Authorization': tokenIn, 
                'Content-Type': 'application/json'
            },
            data : data
          };

        await axios(config)
        .then(function (response) {
            chkresult = response.data
        })
        .catch(function (error) {
            chkresult = error.response
            console.log(error);
        });

        return chkresult
        
    } catch (error) {
        console.log(error)
        return error
    }
}